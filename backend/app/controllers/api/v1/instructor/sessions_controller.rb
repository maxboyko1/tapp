# frozen_string_literal: true

class Api::V1::Instructor::SessionsController < ApplicationController
    # GET /sessions
    def index
        render_success Session.order(:id)
    end
end
