# frozen_string_literal: true

class ApplicantMatchingDatumSerializer < ActiveModel::Serializer
    attributes :id,
               :applicant_id,
               :session_id,
               :min_hours_owed,
               :max_hours_owed,
               :prev_hours_fulfilled,
               :letter_template_id,
               :active_confirmation_status,
               :active_confirmation_url_token,
               :active_confirmation_recent_activity_date,
               :active_confirmation_nag_count,
               :note,
               :hidden
end
