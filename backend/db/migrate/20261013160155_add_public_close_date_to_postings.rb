class AddPublicCloseDateToPostings < ActiveRecord::Migration[6.1]
    def change
        add_column :postings, :public_close_date, :datetime
    end
end
