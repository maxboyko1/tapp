# frozen_string_literal: true

class PostingService
    include TransactionHandler
    attr_reader :posting, :application

    def initialize(params: nil, posting: nil)
        @params = params
        @posting = posting
    end

    # Assemble a survey for the posting
    def survey
        # Load the base survey structure from survey.json
        fixed_survey = JSON.parse(File.read(Rails.root.join('app', 'data', 'survey.json')))

        # Add the posting_questions_page, if there are any posting-specific questions
        if @posting.custom_questions.present? && @posting.custom_questions['elements'].present?
            posting_questions_page = {
                'title' => 'Posting-Specific Questions',
                'name' => 'posting_questions_page',
                'elements' => @posting.custom_questions['elements']
            }
            fixed_survey['pages'] << posting_questions_page
        end

        # Prepare all position data for drag/drop board and custom question panels
        positions = assemble_position_data
        fixed_survey['positions'] = positions

        # Preferences page, drag and drop component for selecting position preferences
        preferences_page = {
            'name' => 'preferences_page',
            'title' => 'Position Preferences',
            'elements' => [
                {
                    'type' => 'preference-board',
                    'name' => 'position_preferences',
                    'title' => 'Rank the positions you are interested in TAing for in order of preference by dragging and dropping them into their respective region below, leaving everything else in the "Unwilling" category.',
                    'description' => 'The first four regions have capacity limits. You can also click on any position to see its associated hours, duties and qualifications info.',
                    'positions' => positions
                }
            ]
        }
        fixed_survey['pages'] << preferences_page

        # Add position-specific questions page
        position_panels = positions.map do |pos|
            custom_question_elements =
                if pos[:custom_questions].present? && pos[:custom_questions]['elements'].present?
                    pos[:custom_questions]['elements'].map do |el|
                        el = el.deep_dup
                        el['name'] = "#{pos[:id]}:#{el['name']}"
                        el['title'] = el['title'] || el['name'].split(':', 2).last
                        el
                    end
                else
                    [
                        {
                            'type' => 'html',
                            'name' => "no_questions_#{pos[:id]}",
                            'html' => '<i>No questions for this position.</i>'
                        }
                    ]
                end
            {
                'type' => 'panel',
                'name' => "panel_#{pos[:id]}",
                'title' => pos[:text].to_s,
                'visibleIf' => "{position_preferences.#{pos[:id]}} >= 0",
                'elements' => custom_question_elements
            }
        end

        # This placeholder_panel logic is a workaround for a quirk of Survey.js that removes the
        # entire page from the survey if its elements field is empty, which is not really what we
        # want, we would rather show a message like this saying that no positions were selected.
        placeholder_panel = {
            'type' => 'panel',
            'name' => 'no_positions_checked_panel',
            'title' => '(No Positions Selected)',
            'visibleIf' => positions.map { |pos| "{position_preferences.#{pos[:id]}} = -1" }.join(' and '),
            'elements' => [
                {
                    'type' => 'html',
                    'name' => 'no_positions_placeholder',
                    'html' => 'No positions have been checked for inclusion on the prior page.'
                }
            ]
        }

        if positions.any?
            position_panels.unshift(placeholder_panel)
        else
            # If there are no positions at all, show the placeholder panel without visibleIf
            position_panels << placeholder_panel.except('visibleIf')
        end

        position_questions_page = {
            'title' => 'Position-Specific Questions',
            'name' => 'position_questions_page',
            'elements' => position_panels
        }
        fixed_survey['pages'] << position_questions_page

        comments_page = {
            'name' => 'comments_page',
            'elements' => [
                {
                    'type' => 'comment',
                    'name' => 'comments',
                    'title' => 'Additional Comments',
                    'description' =>
                        'If there is anything you feel we should know, special arrangements/requests for work, etc., enter it below.'
                }
            ]
        }
        fixed_survey['pages'] << comments_page

        fixed_survey['pages'].each do |page|
            page['description'] = 'Your responses will be saved once you submit your application, you may return to edit and re-submit later if necessary.'
        end

        fixed_survey['title'] = "#{@posting.name} (#{availability_description})"
        fixed_survey['description'] = @posting.intro_text

        fixed_survey
    end

    # Prefills data based on the last application that
    # the `user` filled out.
    def prefill(user:)
        utorid = user.utorid
        applicant = Applicant.find_by(utorid: utorid)
        return { utorid: utorid } unless applicant

        # This is the basic data we can get if the applicant already exists
        data = {
            utorid: utorid,
            student_number: applicant.student_number,
            first_name: applicant.first_name,
            last_name: applicant.last_name,
            email: applicant.email,
            phone: applicant.phone
        }

        existing_application =
            Application.find_by(posting: @posting, applicant: applicant)
        if existing_application
            application_service =
                ApplicationService.new application: existing_application
            data.merge! application_service.prefilled_data
        else
            # Some information rarely changes from application to application.
            # For example, the program of study/department/program start.
            # We retrieve this information from the most recently completed application
            # if it's available.
            last_application =
                Application.joins(:applicant).where(applicant: applicant).order(
                    updated_at: :DESC
                ).first
            application_service =
                ApplicationService.new application: last_application
            last_application_data = application_service.prefilled_data
            data.merge! last_application_data.slice(
                            :department,
                            :program,
                            :program_start
                        ).compact
        end

        data
    end

    def process_answers(user:, answers:)
        utorid = user.utorid
        answers = answers.to_hash.symbolize_keys

        # Get all valid position ids for this posting
        all_ids = PostingPosition.joins(:position)
            .where(posting: @posting)
            .pluck('positions.id')

        # Extract position preferences from drag-and-drop board
        preference_levels_by_id = answers[:position_preferences] || {}

        # Build preference_levels hash (all positions get a value, default -1)
        preference_levels = {}
        all_ids.each do |position_id|
            level = preference_levels_by_id[position_id.to_s]
            preference_levels[position_id] = level.nil? ? -1 : level.to_i
        end

        # Extract position-specific custom question answers
        position_custom_answers = {}
        all_ids.each do |position_id|
            answers_for_id = answers.select { |k, _| k.to_s.start_with?("#{position_id}:") }
            cleaned = {}
            answers_for_id.each do |k, v|
                cleaned[k.to_s.sub(/^#{position_id}:/, '')] = v
            end
            position_custom_answers[position_id] = cleaned unless cleaned.empty?
        end

        # Clean up posting answers json by removing position_preferences,
        # so we don't have this redundant info stored in the custom_question_answers later
        answers.delete(:position_preferences)
        all_ids.each do |position_id|
            answers.keys.grep(/^#{position_id}:/).each { |k| answers.delete(k) }
        end

        # Extract applicant info
        applicant_attributes = answers
        rest = applicant_attributes.slice!(
            :email, :first_name, :last_name, :phone, :student_number
        )
        applicant_attributes[:utorid] = utorid

        # Extract application info
        application_attributes = rest
        rest = application_attributes.slice!(
            :comments, :department, :gpa, :program
        )

        # Build prior_assignments from the applicant's offer history
        @applicant = Applicant.find_or_initialize_by(utorid: utorid)
        applicant = @applicant
        offer_history = assemble_offer_history(applicant)
        prior_assignments = offer_history.map do |(course, session_name, *_rest)|
            "#{course} (#{session_name})"
        end
        rest[:prior_assignments] = prior_assignments unless prior_assignments.empty?

        # Year in progress computed backwards from the date
        if rest[:program_start]
            start_of_fall = Date.today.beginning_of_year + 9.months
            start_of_fall -= 1.year if Date.today - Date.today.beginning_of_year < 4.months.in_days
            application_attributes[:yip] =
                ((start_of_fall - Date.parse(rest[:program_start])) / 356).floor + 1
        end
        application_attributes[:session] = @posting.session
        application_attributes[:posting] = @posting

        # Build position preference attributes for all positions
        position_preferences_attributes = all_ids.map do |position_id|
            {
                position_id: position_id,
                preference_level: preference_levels[position_id],
                custom_question_answers: position_custom_answers[position_id] || {},
                created_at: DateTime.now,
                updated_at: DateTime.now
            }
        end

        # Extract all the file upload questions
        @file_upload_answers = rest
        rest = @file_upload_answers.slice!(*file_upload_questions.map(&:to_sym))

        # Find if this applicant has an existing associated application.
        application = @applicant.applications.find_by(posting: @posting)
        application_attributes[:id] = application.id if application

        # Store anything else remaining as posting-level custom question answers
        rest.keys.grep(/^panel_/).each { |k| rest.delete(k) }
        application_attributes[:custom_question_answers] = rest

        @applicant.attributes =
            applicant_attributes.merge(
                applications_attributes: [application_attributes]
            )
        @position_preferences_attributes = position_preferences_attributes
    end

    # Splits a Survey.js response object into the required pieces
    # (some of the data gets stored in database tables, some of it gets stored
    # as JSON blobs).
    def save_answers!
        start_transaction_and_rollback_on_exception do
            @applicant.save!
            application = @applicant.applications.find_by(posting: @posting)
            # upsert_all will very efficiently upsert all the position preferences.
            unless @position_preferences_attributes.blank?
                PositionPreference.upsert_all(
                    @position_preferences_attributes.map do |a|
                        a.merge({ application_id: application.id })
                    end,
                    unique_by: %i[position_id application_id]
                )
            end
        end
        # Saving attachments cannot happen inside of a transaction.
        # See https://github.com/rails/rails/issues/41903
        @application = @applicant.applications.find_by(posting: @posting)
        @application.documents.purge
        @application.documents.attach files_for_active_storage
    end

    private

    def availability_description
        if @posting.open_date.year == @posting.close_date.year
            "Available from #{@posting.open_date.strftime('%b %d')} to #{
                @posting.close_date.strftime('%b %d, %Y')
            }"
        else
            "Available from #{
                @posting.open_date.strftime('%b %d, %Y')
            } to #{@posting.close_date.strftime('%b %d, %Y')}"
        end
    end

    def assemble_offer_history(applicant)
        Assignment.joins(:applicant, :offers, position: :session)
            .where(applicant: applicant, "offers.status": 'accepted')
            .where.not(positions: { session_id: @posting.session.id }) # Exclude current session
            .order("offers.position_start_date": :ASC)
            .pluck(
                'positions.position_code',
                'sessions.name',
                'offers.hours',
                'offers.position_start_date',
                'offers.position_end_date'
            )
    end

    # We need to use the `posting_positions` to create
    def assemble_position_data
        PostingPosition.joins(:position).where(posting: @posting).order(
            :'positions.position_code'
        ).pluck(
            'positions.position_code',
            'positions.position_title',
            'positions.duties',
            'positions.qualifications',
            'positions.hours_per_assignment',
            'positions.custom_questions',
            'positions.id'
        ).map do |(code, title, duties, qualifications, hours, custom_questions, id)|
            {
                id: id,
                text: (title.blank? ? code : "#{code} - #{title}"),
                value: code,
                duties: duties,
                qualifications: qualifications,
                hours_per_assignment: hours,
                custom_questions: custom_questions
            }
        end
    end

    # Returns a list of all question ids for questions with a file upload
    def file_upload_questions
        nested_find(survey, 'type').filter do |obj|
            obj['type'] == 'file'
        end.map { |obj| obj['name'] }
    end

    # Active storage wants blobs formatted the format
    # { io: ..., filename: ..., content_type: ... }
    def files_for_active_storage
        @file_upload_answers.map do |key, objs|
            # objs should be an array of survey.js file objects.
            # A survey.js file object has feilds "name", "type", "content"
            objs.map do |survey_js_file|
                base_64_data = survey_js_file['content'].sub(/^data:.*,/, '')
                decoded_data = Base64.decode64(base_64_data)

                {
                    io: StringIO.new(decoded_data),
                    filename: "#{key}_#{survey_js_file['name']}",
                    content_type: survey_js_file['type'],
                    # without `identify: false`, rails will try to call various programs (e.g. ImageMagic)
                    # to analyze files. We don't have those programs installed, so we don't wan't rails erroring
                    # while trying to call them.
                    identify: false
                }
            end
        end.flatten
    end
end

# Recursively find all objects with the specified key.
# This function is modified from
# https://stackoverflow.com/questions/22720849/ruby-search-for-super-nested-key-from-json-response
def nested_find(obj, needed_key)
    return [] unless obj.is_a?(Array) || obj.is_a?(Hash)

    ret = []

    if obj.is_a?(Hash)
        ret.push obj if obj[needed_key]
        obj.each { |_hash, val| ret += nested_find(val, needed_key) }
    end
    obj.each { |val| ret += nested_find(val, needed_key) } if obj.is_a?(Array)
    ret
end
