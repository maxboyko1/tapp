# frozen_string_literal: true

# A class representing a school term. For example, "fall 2018".
class Session < ApplicationRecord
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

    after_commit :sync_min_hours_owed_from_reference_session,
                 on: %i[create update],
                 if: :saved_change_to_hours_ref_session_id?

    private

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
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#
