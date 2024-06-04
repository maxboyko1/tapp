# frozen_string_literal: true

FactoryBot.define do
    factory :applicant_matching_datum do
        association :session
        association :applicant, :with_student_number
        min_hours_owed { 0 }
        max_hours_owed { 0 }
        prev_hours_fulfilled { 0 }
        note { 'MyText' }
        letter_template
    end
end

# == Schema Information
#
# Table name: applicant_matching_data
#
#  id                        :integer          not null, primary key
#  session_id                :integer          not null
#  applicant_id              :integer          not null
#  letter_template_id        :integer          not null
#  active_confirmation_id    :integer
#  min_hours_owed            :float
#  max_hours_owed            :float
#  prev_hours_fulfilled      :float
#  note                      :text
#  hidden                    :boolean          default: false
#
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
# Indexes
#
#  index_applicant_matching_data_on_active_confirmation_id       (active_confirmation_id)
#  index_applicant_matching_data_on_letter_template_id           (letter_template_id)
#  index_applicant_matching_data_on_applicant_id                 (applicant_id)
#  index_applicant_matching_data_on_session_id                   (session_id)
#  index_applicant_matching_data_on_session_id_and_applicant_id  (session_id, applicant_id) UNIQUE
#
