# frozen_string_literal: true

class Api::V1::Admin::MatchesController < ApplicationController
    include TransactionHandler
    before_action :find_match, only: %i[show delete]

    # GET /sessions/:session_id/matches
    def index
        render_success Match.by_session(params[:session_id]).order(:id)
    end

    def show
        render_success @match
    end

    # POST /matches
    def create
        @match = Match.find_by(id: params[:id])
        puts @match.inspect
        update && return if @match.present?

        start_transaction_and_rollback_on_exception do
            @match = Match.create!(match_params)
            render_success @match
        end
    end

    # POST /matches/delete
    def delete
        render_on_condition(
            object: @match, condition: proc { @match.destroy! }
        )
    end

    private

    def find_match
        @match = Match.find(params[:id])
    end

    def match_params
        params.permit(
            :position_id,
            :applicant_id,
            :hours_assigned,
            :assigned,
            :starred,
            :hidden
        )
    end

    def update
        start_transaction_and_rollback_on_exception do
            @match.update!(match_params)
            render_success @match
        end
    end
end
