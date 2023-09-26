# frozen_string_literal: true

class ApplicantMatchingDatum < ApplicationRecord
    belongs_to :applicant
    belongs_to :session

    scope :by_session, ->(session_id) { where(session_id: session_id) }
    scope :by_applicant, ->(applicant_id) { where(applicant_id: applicant_id) }

    validates :min_hours_owed, numericality: true, allow_nil: true
    validates :max_hours_owed, numericality: true, allow_nil: true
    validates :prev_hours_fulfilled, numericality: true, allow_nil: true

    validates_uniqueness_of :applicant_id, scope: %i[session_id]
end

# == Schema Information
#
# Table name: applicant_matching_data
#
#  id                   :integer          not null, primary key
#  session_id           :integer          not null
#  applicant_id         :integer          not null
#  min_hours_owed       :float
#  max_hours_owed       :float
#  prev_hours_fulfilled :float
#  note                 :text
#  hidden               :boolean          default: false
#
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
# Indexes
#
#  index_applicant_matching_data_on_applicant_id                    (applicant_id)
#  index_applicant_matching_data_on_session_id                      (session_id)
#  index_applicant_matching_data_on_session_id_and_applicant_id     (session_id, applicant_id) UNIQUE
#
