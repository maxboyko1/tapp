# frozen_string_literal: true

class ConfirmationSerializer < ActiveModel::Serializer
    attributes :id,
               :applicant_matching_datum_id,
               :first_name,
               :last_name,
               :email,
               :min_hours_owed,
               :max_hours_owed,
               :prev_hours_fulfilled,
               :ta_coordinator_name,
               :ta_coordinator_email,
               :signature,
               :emailed_date,
               :accepted_date,
               :rejected_date,
               :withdrawn_date,
               :url_token,
               :nag_count,
               :status
end
