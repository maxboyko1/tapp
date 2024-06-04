# frozen_string_literal: true

class Confirmation < ApplicationRecord
    CONFIRMATION_STATUS = %i[provisional pending accepted rejected withdrawn].freeze
    belongs_to :applicant_matching_datum

    has_secure_token :url_token
    enum status: CONFIRMATION_STATUS

    scope :withdraw_all,
          -> { update_all(status: :withdrawn, withdrawn_date: Time.zone.now) }

    before_create :populate_confirmation
    before_update :set_status_date

    # Can an applicant accept this appointment confirmation?
    def can_accept?
        !accepted? && !rejected? && !withdrawn?
    end

    # Can an applicant reject this appointment confirmation?
    def can_reject?
        !accepted? && !rejected? && !withdrawn?
    end

    private

    def populate_confirmation
        applicant = applicant_matching_datum.applicant
        self.first_name = applicant.first_name
        self.last_name = applicant.last_name
        self.email = applicant.email

        self.min_hours_owed = applicant_matching_datum.min_hours_owed
        self.max_hours_owed = applicant_matching_datum.max_hours_owed
        self.prev_hours_fulfilled = applicant_matching_datum.prev_hours_fulfilled
        self.letter_template = applicant_matching_datum.letter_template.template_file
        self.ta_coordinator_email = Rails.application.config.ta_coordinator_email
        self.ta_coordinator_name = Rails.application.config.ta_coordinator_name
    end

    def set_status_date
        if status_changed?
            case status.to_sym
            when :accepted
                self.accepted_date = Time.zone.now
            when :rejected
                self.rejected_date = Time.zone.now
            when :withdrawn
                self.withdrawn_date = Time.zone.now
            when :pending
                self.emailed_date = Time.zone.now
            end
        end
    end
end

# == Schema Information
#
# Table name: confirmations
#
#  id                                :integer          not null, primary key
#  applicant_matching_datum_id       :integer          not null
#  letter_template                   :string
#  first_name                        :string
#  last_name                         :string
#  email                             :string
#  min_hours_owed                    :float
#  max_hours_owed                    :float
#  prev_hours_fulfilled              :float
#  ta_coordinator_name               :string
#  ta_coordinator_email              :string
#  emailed_date                      :datetime
#  signature                         :string
#  accepted_date                     :datetime
#  rejected_date                     :datetime
#  withdrawn_date                    :datetime
#  nag_count                         :integer          default("0")
#  url_token                         :string
#  created_at                        :datetime         not null
#  updated_at                        :datetime         not null
#  status                            :integer          default("0"), not null
#
# Indexes
#
#  index_confirmations_on_applicant_matching_datum_id  (applicant_matching_datum_id)
#  index_confirmations_on_url_token                    (url_token)
#
