# frozen_string_literal: true

# A class representing an appointment letter template, representing
# the location of a template file associated with an appointment letter.
class LetterTemplate < ApplicationRecord
    belongs_to :session

    validates_uniqueness_of :template_name, scope: %i[session]
    validates_presence_of :template_name, :template_file

    scope :by_session, ->(session_id) { where(session: session_id).order(:id) }
end

# == Schema Information
#
# Table name: letter_templates
#
#  id            :integer          not null, primary key
#  session_id    :integer          not null
#  template_name :string
#  template_file :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
# Indexes
#
#  index_letter_templates_on_session_id  (session_id)
#
