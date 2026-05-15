# frozen_string_literal: true

class Api::V1::Instructor::MatchesController < ApplicationController
    def index
        render_success(
            Match.by_session(params[:session_id]).tentative
        )
    end

    def show
        match = Match.find(params[:id])
        render_success(match)
    end
end
