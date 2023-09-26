# frozen_string_literal: true

class ApplicantMatchingDatumSerializer < ActiveModel::Serializer
    attributes :id,
               :applicant_id,
               :session_id,
               :min_hours_owed,
               :max_hours_owed,
               :prev_hours_fulfilled,
               :note,
               :hidden
end
