class AddPositionSpecificCustomQuestions < ActiveRecord::Migration[6.1]
    def change
        add_column :positions, :custom_questions, :json
        add_column :position_preferences, :custom_question_answers, :json
    end
end
