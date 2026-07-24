# frozen_string_literal: true

class Api::V1::Admin::SessionPositionsController < Api::V1::Admin::PositionsController
    before_action :find_session

    # GET /positions
    def index
        render_success @session.positions.order(:position_code)
    end

    # POST /positions
    def create
        upsert
    end

    # POST /positions/:id/email
    def email
        find_position
        PositionMailer.email_ddah_reminder(@position).deliver_now!

        @position.last_emailed_date = Time.now
        @position.save!

        render_success @position
    end

    private

    def find_position
        find_session
        @position = @session.positions.find_by_id(params[:id])
    end

    def find_session
        @session = Session.find(params[:session_id])
    end
end
