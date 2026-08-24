class AddDdahOutlineToSessions < ActiveRecord::Migration[6.1]
    def change
        add_column :sessions, :ddah_outline, :jsonb
        add_column :duties, :is_fixed, :boolean, default: false, null: false
    end
end
