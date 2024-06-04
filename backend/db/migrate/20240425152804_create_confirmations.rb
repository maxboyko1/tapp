class CreateConfirmations < ActiveRecord::Migration[6.1]
    def change
        create_table :confirmations do |t|
            t.references :applicant_matching_datum, null: false, foreign_key: true
            t.string :letter_template
            t.string :first_name
            t.string :last_name
            t.string :email
            t.float :min_hours_owed
            t.float :max_hours_owed
            t.float :prev_hours_fulfilled
            t.string :ta_coordinator_name
            t.string :ta_coordinator_email
            t.datetime :emailed_date
            t.string :signature
            t.datetime :accepted_date
            t.datetime :rejected_date
            t.datetime :withdrawn_date
            t.integer :status, default: 0, null: false
            t.integer :nag_count, default: 0
            t.string :url_token

            t.timestamps
        end
        add_index :confirmations, :url_token
    end
end
