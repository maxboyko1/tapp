class AddHoursReferenceSessionToSessions < ActiveRecord::Migration[6.1]
    def change
        add_reference :sessions,
                      :hours_ref_session,
                      null: true,
                      index: true,
                      foreign_key: {
                          to_table: :sessions,
                          on_delete: :nullify
                      }

        add_index :applicant_matching_data,
                  %i[session_id applicant_id],
                  unique: true,
                  name: 'index_applicant_matching_data_on_session_id_and_applicant_id'
    end
end
