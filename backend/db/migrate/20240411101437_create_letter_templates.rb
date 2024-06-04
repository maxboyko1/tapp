class CreateLetterTemplates < ActiveRecord::Migration[6.1]
    def change
        create_table :letter_templates do |t|
            t.references :session, null: false, foreign_key: true
            t.string :template_name
            t.string :template_file

            t.timestamps
        end
    end
end
