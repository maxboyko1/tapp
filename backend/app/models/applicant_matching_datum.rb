# frozen_string_literal: true

class ApplicantMatchingDatum < ApplicationRecord
    has_many :confirmations, dependent: :destroy
    belongs_to :active_confirmation, class_name: 'Confirmation', optional: true
    belongs_to :applicant
    belongs_to :session
    belongs_to :letter_template

    scope :by_session, ->(session_id) { where(session_id: session_id) }
    scope :by_applicant, ->(applicant_id) { where(applicant_id: applicant_id) }

    scope :with_pending_or_accepted_confirmation,
          lambda {
              joins(:active_confirmation).where(
                  confirmations: { status: %i[pending accepted] }
              )
          }

    validates :min_hours_owed, numericality: true, allow_nil: true
    validates :max_hours_owed, numericality: true, allow_nil: true
    validates :prev_hours_fulfilled, numericality: true, allow_nil: true

    validates_uniqueness_of :applicant_id, scope: %i[session_id]

    def active_confirmation_status
        active_confirmation.blank? ? nil : active_confirmation.status
    end

    def active_confirmation_url_token
        active_confirmation.blank? ? nil : active_confirmation.url_token
    end

    def active_confirmation_nag_count
        active_confirmation.blank? ? nil : active_confirmation.nag_count
    end

    # Return the date of the most recent activity concerning the
    # active appointment confirmation.
    def active_confirmation_recent_activity_date
        if active_confirmation.blank?
            nil
        else
            [
                active_confirmation.emailed_date,
                active_confirmation.withdrawn_date,
                active_confirmation.accepted_date,
                active_confirmation.rejected_date
            ].compact.max
        end
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
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#
# Indexes
#
#  index_applicant_matching_data_on_active_confirmation_id          (active_confirmation_id)
#  index_applicant_matching_data_on_letter_template_id              (letter_template_id)
#  index_applicant_matching_data_on_applicant_id                    (applicant_id)
#  index_applicant_matching_data_on_session_id                      (session_id)
#  index_applicant_matching_data_on_session_id_and_applicant_id     (session_id, applicant_id) UNIQUE
#
