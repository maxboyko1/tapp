# frozen_string_literal: true

FactoryBot.define do
    factory :letter_template do
        association :session
        template_name { 'MyString' }
        template_file { 'MyString' }
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
