class AddLastEmailedDateToPositions < ActiveRecord::Migration[6.1]
    def change
        add_column :positions, :last_emailed_date, :datetime
    end
end
