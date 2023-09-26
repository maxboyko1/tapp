# frozen_string_literal: true

class MatchSerializer < ActiveModel::Serializer
    attributes :id,
               :applicant_id,
               :position_id,
               :hours_assigned,
               :assigned,
               :starred,
               :hidden
end
