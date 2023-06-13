class AddCvLinkToApplications < ActiveRecord::Migration[6.1]
  def change
    add_column :applications, :cv_link, :string
  end
end
