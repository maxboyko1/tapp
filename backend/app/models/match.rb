# frozen_string_literal: true

class Match < ApplicationRecord
    belongs_to :applicant
    belongs_to :position

    scope :by_position, ->(position_id) { where(position_id: position_id) }
    scope :by_applicant, ->(applicant_id) { where(applicant_id: applicant_id) }
    scope(
        :by_session,
        lambda do |session_id|
            joins(:position).where(positions: { session: session_id }).group(
                :id
            )
        end
    )

    validates_uniqueness_of :applicant_id, scope: %i[position_id]
end

# == Schema Information
#
# Table name: matches
#
#  id                   :integer          not null, primary key
#  applicant_id         :integer          not null
#  position_id          :integer          not null
#  hours_assigned       :float
#  assigned             :boolean          default: false
#  starred              :boolean          default: false
#  hidden               :boolean          default: false
#
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
# Indexes
#
#  index_matches_on_applicant_id                    (applicant_id)
#  index_matches_on_position_id                     (position_id)
#  index_matches_on_position_id_and_applicant_id    (position_id,applicant_id) UNIQUE
#
