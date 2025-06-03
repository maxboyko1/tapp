# frozen_string_literal: true

class ApplicationService
    include TransactionHandler
    attr_reader :application

    def initialize(application: nil)
        @application = application
        @applicant = @application&.applicant
    end

    # Return the "prefilled data" associated with this application. This is the data that
    # can be prefilled when an application re-fills out an application
    def prefilled_data
        data = {}
        return data if @application.blank?

        # Top-level application fields
        application_data = @application.attributes.slice(
            'program',
            'department',
            'yip',
            'previous_department_ta',
            'previous_university_ta',
            'previous_experience_summary',
            'gpa',
            'comments'
        ).compact
        data.merge! application_data

        # Custom question answers (posting-level)
        if @application.custom_question_answers
            data.merge! @application.custom_question_answers.except('utorid')
        end

        # Position preferences and position-specific answers
        willing_positions = []
        willing_only_positions = []
        ranked_positions = []

        position_preferences_subs.each do |preference|
            code = preference['position_code']
            pos_id = preference['position_id']
            level = preference['preference_level'].to_i

            # Willing if level >= 0
            willing_positions << code if level >= 0

            # Ranked if level > 0 (sort by level descending)
            if level.positive?
                ranked_positions << [code, level]
            elsif level.zero?
                willing_only_positions << code
            end

            # Position-specific custom question answers
            next unless preference['custom_question_answers'].present?

            preference['custom_question_answers'].each do |k, v|
                data["#{pos_id}:#{k}"] = v
            end
        end

        # Sort ranked_positions by level descending, then by code for stability
        ranked_positions.sort_by! { |code, level| [-level, code] }
        # Prefill ranking with ranked positions first, then willing-only positions
        data[:willing_positions] = willing_positions
        data[:position_preferences] = ranked_positions.map(&:first) + willing_only_positions

        data.symbolize_keys!
    end

    # Generate JSON subsitutisions that can be used in a liquit template
    def subs
        {
            email: @applicant.email,
            first_name: @applicant.first_name,
            last_name: @applicant.last_name,
            utorid: @applicant.utorid,
            student_number: @applicant.student_number,
            phone: @applicant.phone,
            posting_name: @application.posting.name,
            position_preferences: position_preferences_subs,
            ta_coordinator_name: Rails.application.config.ta_coordinator_name,
            ta_coordinator_email: Rails.application.config.ta_coordinator_email,
            updated_date:
                [
                    # When resubmitting application, it's possible the application didn't change,
                    # but instead the applicant information changed. We look for the most recent
                    # updated date in that case.
                    @application.updated_at,
                    @applicant.updated_at
                ].max.in_time_zone('Eastern Time (US & Canada)'),
            program: @application.program,
            department: @application.department,
            previous_department_ta: @application.previous_department_ta,
            previous_university_ta: @application.previous_university_ta,
            previous_experience_summary:
                @application.previous_experience_summary,
            comments: @application.comments
        }
    end

    private

    # Assemble JSON that can be used to do the substitutions in a liquid template.
    def position_preferences_subs
        PositionPreference.joins(:position).where(
            id: application.position_preference_ids
        ).pluck(:"positions.position_code", :"positions.id", :preference_level, :custom_question_answers)
            .map do |(position_code, position_id, preference_level, custom_question_answers)|
            {
                position_code: position_code,
                position_id: position_id,
                preference_level: preference_level,
                custom_question_answers: custom_question_answers
            }.stringify_keys
        end
    end
end
