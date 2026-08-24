# frozen_string_literal: true

# A class representing a school term. For example, "fall 2018".
class Session < ApplicationRecord
    DDAH_OUTLINE_ALLOWED_KEYS = %w[hours description].freeze
    DDAH_DUTY_CATEGORIES = %w[note prep training meeting contact marking other].freeze

    DEFAULT_DDAH_OUTLINE = [
        {
            hours: 1,
            description:
                'meeting:Meetings with instructor including initial DDAH review'
        },
        {
            hours: 0.5,
            description:
                'meeting:Meetings with instructor including mid-term DDAH review'
        }
    ].freeze

    # Each session can have up to one other session it is referencing, from which it will inherit
    # min_hours_owed values for its appointment guarantees
    belongs_to :hours_ref_session, class_name: 'Session', optional: true

    has_many :applications, dependent: :destroy
    # positions must be listed first. Since they also may contain references to
    # `constract_templates`, there is a potential foreign key issue when destroying them
    has_many :positions, dependent: :destroy
    has_many :postings, dependent: :destroy
    has_many :contract_templates, dependent: :destroy
    has_many :letter_templates, dependent: :destroy
    has_many :applicant_matching_data, dependent: :destroy

    has_many :referencing_sessions,
             class_name: 'Session',
             foreign_key: :hours_ref_session_id,
             inverse_of: :hours_ref_session

    validates :rate1, numericality: { only_float: true }, allow_nil: true
    validates :rate2, numericality: { only_float: true }, allow_nil: true
    validates :name, presence: true
    validates_uniqueness_of :name

    validate :session_must_not_self_reference
    validate :session_must_have_strict_role
    validate :ddah_outline_must_be_valid_structure

    before_validation :set_default_ddah_outline, on: :create

    after_commit :sync_min_hours_owed_from_reference_session,
                 on: %i[create update],
                 if: :saved_change_to_hours_ref_session_id?

    private

    def set_default_ddah_outline
        return unless ddah_outline.blank?

        self.ddah_outline = DEFAULT_DDAH_OUTLINE.deep_dup
    end

    # Session cannot use itself as an hours reference session
    def session_must_not_self_reference
        return if hours_ref_session_id.blank?
        return unless id.present? && hours_ref_session_id == id

        errors.add(
            :hours_ref_session_id,
            'session cannot reference itself as an hours reference session'
        )
    end

    # Every session must be either a reference session, a "referencing" session, or neither
    def session_must_have_strict_role
        return if hours_ref_session_id.blank?

        if id.present? && referencing_sessions.exists?
            errors.add(
                :hours_ref_session_id,
                'cannot be set because this session is already a reference session'
            )
        end

        return if hours_ref_session.blank?
        return if hours_ref_session.hours_ref_session_id.blank?

        errors.add(
            :hours_ref_session_id,
            'cannot reference a session that is itself referencing another session'
        )
    end

    # Collect any matching appointment guarantees by applicant from the reference session, and
    # copy their min_hours_owed values to current session if they exist and are non-nil
    def sync_min_hours_owed_from_reference_session
        return if hours_ref_session_id.blank?

        reference_hours_by_applicant_id =
            ApplicantMatchingDatum
                .by_session(hours_ref_session_id)
                .where.not(min_hours_owed: nil)
                .order(:id)
                .group_by(&:applicant_id)
                .transform_values { |matching_data| matching_data.first.min_hours_owed }

        return if reference_hours_by_applicant_id.empty?

        ApplicantMatchingDatum
            .by_session(id)
            .where(applicant_id: reference_hours_by_applicant_id.keys)
            .find_each do |matching_datum|
                copied_min_hours_owed = reference_hours_by_applicant_id[matching_datum.applicant_id]
                next if copied_min_hours_owed.nil?

                matching_datum.update_columns(
                    min_hours_owed: copied_min_hours_owed,
                    updated_at: Time.current
                )
            end
    end

    # Validates that the ddah_outline attribute has a proper structure, i.e. either null, an empty
    # array or an array of objects with valid "hours" and "description" fields. The UI for editing
    # the outline will enforce this structure, but we also check it here to validate any changes
    # to the ddah_outline by other means.
    def ddah_outline_must_be_valid_structure
        return if ddah_outline.nil?

        unless ddah_outline.is_a?(Array)
            errors.add(:ddah_outline, 'must be null or an array of duties')
            return
        end

        ddah_outline.each_with_index do |duty, idx|
            unless duty.is_a?(Hash)
                errors.add(:ddah_outline, "entry #{idx + 1} must be an object")
                next
            end

            duty_keys = duty.keys.map(&:to_s).sort
            unless duty_keys == DDAH_OUTLINE_ALLOWED_KEYS.sort
                errors.add(
                    :ddah_outline,
                    "entry #{idx + 1} must contain only hours and description"
                )
                next
            end

            parsed_duty = duty.with_indifferent_access

            hours = parsed_duty[:hours]
            unless hours.is_a?(Numeric) && hours.finite?
                errors.add(:ddah_outline, "entry #{idx + 1} hours must be numeric")
            end

            description = parsed_duty[:description]
            unless description.is_a?(String)
                errors.add(:ddah_outline, "entry #{idx + 1} description must be a string")
                next
            end

            unless description.include?(':')
                errors.add(
                    :ddah_outline,
                    "entry #{idx + 1} description must use category:description format"
                )
                next
            end

            category, _description = description.split(':', 2)
            next if DDAH_DUTY_CATEGORIES.include?(category)

            errors.add(
                :ddah_outline,
                "entry #{idx + 1} description must start with a valid category"
            )
        end
    end
end

# == Schema Information
#
# Table name: sessions
#
#  id                   :integer          not null, primary key
#  start_date           :datetime
#  end_date             :datetime
#  name        .        :string
#  rate1                :float
#  rate2                :float
#  hours_ref_session_id :bigint
#  ddah_outline         :jsonb
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#
