# frozen_string_literal: true

FactoryBot.define do
    factory :match do
        association :position
        association :applicant, :with_student_number
        hours_assigned { 0 }
    end
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
