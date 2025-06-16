# frozen_string_literal: true

class ApplicationSerializer < ActiveModel::Serializer
    attributes :id,
               :applicant_id,
               :posting_id,
               :comments,
               :program,
               :department,
               :yip,
               :gpa,
               :cv_link,
               :custom_question_answers,
               :annotation,
               :documents,
               :position_preferences,
               :submission_date

    def documents
        object.documents.blobs.map do |blob|
            {
                name: blob.filename,
                type: blob.content_type,
                size: blob.byte_size,
                url_token: blob.key
            }
        end
    end

    def position_preferences
        object.position_preferences.map do |position_preference|
            {
                position_id: position_preference.position_id,
                preference_level: position_preference.preference_level,
                custom_question_answers: position_preference.custom_question_answers
            }
        end
    end

    def submission_date
        object.created_at.in_time_zone('Eastern Time (US & Canada)')
    end
end
