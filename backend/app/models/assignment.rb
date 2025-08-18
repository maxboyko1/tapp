# frozen_string_literal: true

# A class representing an assignment. This class has many offers and belongs to
# applicant and position.
class Assignment < ApplicationRecord
    has_many :offers, dependent: :destroy
    has_many :wage_chunks, dependent: :destroy
    has_one :ddah, dependent: :destroy
    belongs_to :active_offer, class_name: 'Offer', optional: true
    belongs_to :applicant
    belongs_to :position

    validates_uniqueness_of :applicant_id, scope: %i[position_id]

    scope :by_position,
          ->(position_id) { where(position_id: position_id).order(:id) }

    scope(
        :by_session,
        lambda do |session_id|
            joins(:position).where(positions: { session: session_id }).group(
                :id
            )
        end
    )

    # Returns all applications that correspond to applicants with a
    # "pending" or "accepted" active offer. These are special because
    # an instructor should be able to see these applications.
    scope :with_pending_or_accepted_offer,
          lambda {
              joins(:active_offer).where(
                  offers: { status: %i[pending accepted] }
              )
          }

    def hours
        if wage_chunks.blank?
            position.hours_per_assignment
        else
            wage_chunks.sum(:hours)
        end
    end

    def hours=(value)
        if new_record?
            # When a new record is created, `split_and_create_wage_chunks`
            # is called afterwards. It must be called afterwards, because wage chunks
            # cannot be created until after an assignment has been created. Save the
            # hours to use in that function
            @initial_hours = value
        else
            # if the record has already been created, the `after_create` functions
            # will not be called, so call the manually.
            @initial_hours = nil
        end
    end

    def active_offer_status
        active_offer.blank? ? nil : active_offer.status
    end

    def active_offer_url_token
        active_offer.blank? ? nil : active_offer.url_token
    end

    def active_offer_nag_count
        active_offer.blank? ? nil : active_offer.nag_count
    end

    # return the date of the most recent activity concerning the
    # active offer.
    def active_offer_recent_activity_date
        if active_offer.blank?
            nil
        else
            [
                active_offer.emailed_date,
                active_offer.withdrawn_date,
                active_offer.accepted_date,
                active_offer.rejected_date
            ].compact.max
        end
    end

    def start_date
        self[:start_date].blank? ? position.start_date : self[:start_date]
    end

    def end_date
        self[:end_date].blank? ? position.end_date : self[:end_date]
    end

    def start_date=(value)
        self[:start_date] = value.blank? ? position.start_date : value
    end

    def end_date=(value)
        self[:end_date] = value.blank? ? position.end_date : value
    end

    def accessible_by_instructor(instructor_id)
        position.instructors.exists?(instructor_id)
    end
end

# == Schema Information
#
# Table name: assignments
#
#  id                    :integer          not null, primary key
#  position_id           :integer          not null
#  applicant_id          :integer          not null
#  start_date            :datetime
#  end_date              :datetime
#  note                  :text
#  contract_override_pdf :string
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  active_offer_id       :integer
#
# Indexes
#
#  index_assignments_on_active_offer_id               (active_offer_id)
#  index_assignments_on_applicant_id                  (applicant_id)
#  index_assignments_on_position_id                   (position_id)
#  index_assignments_on_position_id_and_applicant_id  (position_id,applicant_id) UNIQUE
#
