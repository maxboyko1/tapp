# frozen_string_literal: true

class Api::V1::Instructor::ApplicantsController < ApplicationController
    # GET /applicants
    def index
        if params[:session_id].blank?
            render_success Applicant.order(:id)
            return
        end
        render_success Applicant.by_session(params[:session_id]).order(:id)
    end
end
