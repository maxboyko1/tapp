# frozen_string_literal: true

class ApplicantMatchingDatum < ApplicationRecord
    has_many :confirmations, dependent: :destroy
    belongs_to :active_confirmation, class_name: 'Confirmation', optional: true
    belongs_to :applicant
    belongs_to :session
    belongs_to :letter_template

    scope :by_session, ->(session_id) { where(session_id: session_id) }
    scope :by_applicant, ->(applicant_id) { where(applicant_id: applicant_id) }

    validates :min_hours_owed, numericality: true, allow_nil: true
    validates :max_hours_owed, numericality: true, allow_nil: true
    validates :prev_hours_fulfilled, numericality: true, allow_nil: true

    validates_uniqueness_of :applicant_id, scope: %i[session_id]

    after_commit :propagate_min_hours_owed_to_referencing_sessions,
                 on: %i[create update],
                 if: :should_propagate_min_hours_owed?

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

    private

    # Check for non-nil changes to min_hours_owed value, propagation in this case
    def should_propagate_min_hours_owed?
        return false if min_hours_owed.nil?
        return true if previous_changes.key?('id')

        previous_changes.key?('min_hours_owed')
    end

    # Propagate min hours owed value to any appointment guarantees for this applicant
    # in any other sessions referencing this one
    def propagate_min_hours_owed_to_referencing_sessions
        ref_session_ids = session.referencing_sessions.pluck(:id)
        return if ref_session_ids.empty?

        ApplicantMatchingDatum
            .where(session_id: ref_session_ids, applicant_id: applicant_id)
            .update_all(min_hours_owed: min_hours_owed, updated_at: Time.current)
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
