# frozen_string_literal: true

class LetterTemplateSerializer < ActiveModel::Serializer
    attributes :id, :template_file, :template_name
end
