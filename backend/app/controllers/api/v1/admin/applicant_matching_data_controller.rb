# frozen_string_literal: true

class Api::V1::Admin::ApplicantMatchingDataController < ApplicationController
    include TransactionHandler
    before_action :find_applicant_matching_datum, only: %i[show delete]

    # GET /sessions/:session_id/applicant_matching_data
    def index
        render_success ApplicantMatchingDatum.by_session(params[:session_id])
    end

    # GET /applicant_matching_data/:applicant_matching_datum_id
    def show
        render_success @applicant_matching_datum
    end

    # POST /applicant_matching_data
    def create
        @applicant_matching_datum = ApplicantMatchingDatum.find_by(
            'session_id = ? AND applicant_id = ?',
            params[:session_id],
            params[:applicant_id]
        )

        puts @applicant_matching_datum.inspect
        update && return if @applicant_matching_datum.present?

        start_transaction_and_rollback_on_exception do
            @applicant_matching_datum = ApplicantMatchingDatum.create!(applicant_matching_datum_params)
            render_success @applicant_matching_datum
        end
    end

    # POST /applicant_matching_data/delete
    def delete
        render_on_condition(
            object: @applicant_matching_datum, condition: proc { @applicant_matching_datum.destroy! }
        )
    end

    private

    def find_applicant_matching_datum
        @applicant_matching_datum = ApplicantMatchingDatum.find(params[:id])
    end

    def applicant_matching_datum_params
        params.permit(
            :session_id,
            :applicant_id,
            :min_hours_owed,
            :max_hours_owed,
            :prev_hours_fulfilled,
            :letter_template_id,
            :note,
            :hidden
        )
    end

    def update
        render_on_condition(
            object: @applicant_matching_datum,
            condition:
                proc do
                    # if the appointment has an active confirmation and it is not provisional or withdrawn,
                    # we cannot update the appointment
                    if @applicant_matching_datum.active_confirmation &&
                           !%w[provisional withdrawn].include?(
                               @applicant_matching_datum.active_confirmation.status
                           )
                        raise StandardError,
                              "Cannot modify an appointment that has an active confirmation with status '#{
                                  @applicant_matching_datum.active_confirmation.status
                              }'"
                    end
                    @applicant_matching_datum.update(applicant_matching_datum_params)
                    # If we ever get to the point where we are updating an appointment, it
                    # cannot have an active appointment confirmation associated with it (because it
                    # just changed, so it will be out of sync with the active confirmation).
                    # Therefore, we remove the active confirmation on any update.
                    @applicant_matching_datum.active_confirmation = nil
                    @applicant_matching_datum.save!
                end
        )
    end
end
