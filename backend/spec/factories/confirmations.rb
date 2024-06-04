# frozen_string_literal: true

FactoryBot.define do
    factory :confirmation do
        applicant_matching_datum { nil }
        letter_template { 'MyString' }
        first_name { 'MyString' }
        last_name { 'MyString' }
        email { 'MyString' }
        min_hours_owed { 0 }
        max_hours_owed { 0 }
        prev_hours_fulfilled { 0 }
        ta_coordinator_name { 'MyString' }
        ta_coordinator_email { 'MyString' }
        emailed_date { '2023-11-10 15:16:25' }
        signature { 'MyString' }
        accepted_date { '2023-11-10 15:16:25' }
        rejected_date { '2023-11-10 15:16:25' }
        withdrawn_date { '2023-11-10 15:16:25' }
        nag_count { 1 }
        url_token { 'MyString' }
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
