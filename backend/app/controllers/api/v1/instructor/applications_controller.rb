# frozen_string_literal: true

# Controller for Applications
class Api::V1::Instructor::ApplicationsController < ApplicationController
    # GET /applications
    def index
        render_success Application.by_session(params[:session_id])
    end
end
