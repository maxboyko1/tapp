# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Confirmation, type: :model do
    describe 'associations' do
        it { should belong_to(:applicant_matching_datum) }
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
