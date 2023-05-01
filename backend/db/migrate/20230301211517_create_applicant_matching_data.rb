class CreateApplicantMatchingData < ActiveRecord::Migration[6.1]
  def change
    create_table :applicant_matching_data do |t|
      t.references :applicant, null: false, foreign_key: true
      t.references :session, null: false, foreign_key: true
      t.float :min_hours_owed
      t.float :max_hours_owed
      t.float :prev_hours_fulfilled
      t.text :note
      t.boolean :hidden, default: false

      t.timestamps
    end

    create_table :matches do |t|
      t.references :applicant, null: false, foreign_key: true
      t.references :position, null: false, foreign_key: true
      t.float :hours_assigned
      t.boolean :assigned, default: false
      t.boolean :starred, default: false
      t.boolean :hidden, default: false

      t.timestamps
    end
  end
end
