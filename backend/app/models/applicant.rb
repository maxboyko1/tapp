# frozen_string_literal: true

# A class representing an applicant. This holds information regarding a student. This class
# has many preferences (a student can apply to many positions).
class Applicant < ApplicationRecord
    has_many :assignments
    has_many :applications, dependent: :destroy
    has_many :applicant_matching_data, dependent: :destroy
    has_many :matches, dependent: :destroy

    accepts_nested_attributes_for :applications

    validates_presence_of :utorid
    validates_uniqueness_of :utorid, case_sensitive: false

    # An applicant can come from an application for the current session, or
    # they could have been given an assignment bypassing the application.
    scope :by_session,
          lambda { |session_id|
              left_outer_joins(:applications, assignments: :position).where(
                  'applications.session_id = ? OR positions.session_id = ?',
                  session_id,
                  session_id
              ).group(:id)
          }
end

# == Schema Information
#
# Table name: applicants
#
#  id             :integer          not null, primary key
#  utorid         :string           not null
#  student_number :string
#  first_name     :string
#  last_name      :string
#  email          :string
#  phone          :string
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
# Indexes
#
#  index_applicants_on_utorid  (utorid) UNIQUE
#
