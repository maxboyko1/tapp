class RemoveExperienceFieldsFromApplication < ActiveRecord::Migration[6.1]
    def change
        remove_column :applications, :previous_department_ta, :boolean
        remove_column :applications, :previous_university_ta, :boolean
        remove_column :applications, :previous_experience_summary, :text
    end
end
