# frozen_string_literal: true

FactoryBot.define do
    factory :position do
        session
        contract_template
        position_code { Faker::String.random(length: 3..12) }
        position_title { Faker::String.random(length: 3..12) }
        hours_per_assignment { 1.5 }
        start_date { '2019-11-10 14:40:15' }
        end_date { '2019-11-10 14:40:15' }
        custom_questions { 'MyText' }
    end
end

# == Schema Information
#
# Table name: positions
#
#  id                   :integer          not null, primary key
#  session_id           :integer          not null
#  position_code        :string
#  position_title       :string
#  hours_per_assignment :float
#  custom_questions     :json
#  start_date           :datetime
#  end_date             :datetime
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  contract_template_id :integer          not null
#
# Indexes
#
#  index_positions_on_contract_template_id  (contract_template_id)
#  index_positions_on_session_id            (session_id)
#
