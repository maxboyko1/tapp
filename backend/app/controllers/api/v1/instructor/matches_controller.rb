# frozen_string_literal: true

class Api::V1::Instructor::MatchesController < ApplicationController
    before_action :validate_instructor

    def index
        render_success(
            Match.by_session(params[:session_id]).tentative
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
