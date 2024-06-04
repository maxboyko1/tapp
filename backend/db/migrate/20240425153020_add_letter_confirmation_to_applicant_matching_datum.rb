class AddLetterConfirmationToApplicantMatchingDatum < ActiveRecord::Migration[6.1]
    def change
        add_reference :applicant_matching_data,
                      :active_confirmation,
                      foreign_key: { to_table: :confirmations }
        add_reference :applicant_matching_data,
                      :letter_template,
                      null: false, foreign_key: true
    end
end
