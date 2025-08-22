# frozen_string_literal: true

class Api::V1::Instructor::AssignmentsController < ApplicationController
    before_action :validate_instructor

    def index
        render_success(
            Assignment.by_session(params[:session_id])
                      .accessible_by_instructor(@active_instructor&.id, @active_user.utorid)
                      .with_pending_or_accepted_offer.map do |assignment|
                override_instance_method(assignment, :active_offer_nag_count, nil)
            end
        )
    end

    private

    def validate_instructor
        @active_user = ActiveUserService.active_user request
        @active_instructor = Instructor.find_by(utorid: @active_user.utorid)
        admin_utorids = Rails.configuration.always_admin

        unless @active_instructor || admin_utorids.include?(@active_user.utorid)
            render_error(message: 'Not an instructor or admin')
        end
    end
end

# Override an instance method to always return `value`
# Code modified from https://stackoverflow.com/questions/135995/is-it-possible-to-define-a-ruby-singleton-method-using-a-block
def override_instance_method(obj, method_name, value)
    metaclass =
        class << obj
            self
        end

    metaclass.send :define_method, method_name do
        value
    end

    obj
end
