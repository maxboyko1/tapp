class AddTentativeToMatches < ActiveRecord::Migration[6.1]
    def change
        add_column :matches, :tentative, :boolean, default: false
    end
end
