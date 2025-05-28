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

        # Grab the non-nil attributes from the application that we want to return.
        # Some attributes, like `annotation`, are private, and shouldn't be returned.
        application_data =
            @application.attributes.slice(
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

        # Custom question answers are stored as a JSON blob in the database. We unpack them if there are any
        if @application.custom_question_answers
            data.merge! @application.custom_question_answers.except('utorid')
        end

        # Position-preferences and position custom_question_answers must be reconstructed from the database.
        position_preferences = {}
        position_answers = {}
        position_preferences_subs.each do |preference|
            position_preferences[preference['position_code']] = preference['preference_level']
            if preference['custom_question_answers'].present?
                # Re-nest under panel_{code} for SurveyJS
                position_answers["panel_#{preference['position_code']}"] = preference['custom_question_answers']
            end
        end
        data[:position_preferences] = position_preferences
        data.merge!(position_answers)

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
            cv_link: @application.cv_link,
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
        ).pluck(:"positions.position_code", :preference_level, :custom_question_answers)
            .map do |(position_code, preference_level, custom_question_answers)|
            {
                position_code: position_code,
                preference_level: preference_level,
                custom_question_answers: custom_question_answers
            }.stringify_keys
        end
    end
end
