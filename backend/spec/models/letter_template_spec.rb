# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LetterTemplate, type: :model do
    describe 'associations' do
        it { should belong_to(:session) }
    end
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
