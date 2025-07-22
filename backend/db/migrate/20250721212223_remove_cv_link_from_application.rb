class RemoveCvLinkFromApplication < ActiveRecord::Migration[6.1]
    def change
        remove_column :applications, :cv_link, :string
    end
end
