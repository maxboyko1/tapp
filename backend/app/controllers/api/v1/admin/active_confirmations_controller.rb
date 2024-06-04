# frozen_string_literal: true

# Controller for Active Appointment Confirmations to TAs for upcoming Fall/Winter terms
class Api::V1::Admin::ActiveConfirmationsController < ApplicationController
    before_action :find_applicant_matching_datum

    # GET /active_confirmations
    # Return the active_confirmation associated with an Appointment
    def index
        render_success @applicant_matching_datum.active_confirmation
    end

    # POST /active_confirmations/create
    # Create an active_confirmation for an Appointment
    def create
        if @applicant_matching_datum.active_confirmation.present? &&
               @applicant_matching_datum.active_confirmation.status != 'withdrawn'
            render_error(message: I18n.t('active_confirmations.already_exists'))
            return
        end

        start_transaction_and_rollback_on_exception do
            confirmation = @applicant_matching_datum.confirmations.create!
            @applicant_matching_datum.update!(active_confirmation: confirmation)
            render_success @applicant_matching_datum.active_confirmation
        end
    end

    # POST /active_confirmations/accept
    # Accepts the active_confirmation for the specified Appointment
    def accept
        @applicant_matching_datum.active_confirmation.accepted!
        render_success @applicant_matching_datum.active_confirmation
    end

    # POST /active_confirmations/reject
    # Rejects the active_confirmation for the specified Appointment
    def reject
        @applicant_matching_datum.active_confirmation.rejected!
        render_success @applicant_matching_datum.active_confirmation
    end

    # POST /active_confirmations/withdraw
    # Withdraws the active_confirmation for the specified Appointment
    def withdraw
        @applicant_matching_datum.active_confirmation.withdrawn!
        render_success @applicant_matching_datum.active_confirmation
    end

    # POST /active_confirmations/email
    # Emails the active confirmation for the specified Appointment
    def email
        return unless can_be_emailed

        ConfirmationMailer.email_letter(@confirmation).deliver_now!

        if @confirmation.provisional?
            # If the appointment has not been sent before, set status to pending
            @confirmation.pending!
        else
            # If the appointment has been sent before, make sure the emailed date gets updated.
            @confirmation.emailed_date = Time.zone.now
            @confirmation.save!
        end
        render_success @confirmation
    end

    # POST /active_confirmations/nag
    # Sends a nag email for the active_confirmation for the specified Appointment
    # which has already been emailed once
    def nag
        return unless can_be_emailed

        # We cannot nag unless an email has already been sent and the confirmation
        # has not been accepted/rejected
        unless @confirmation.pending?
            render_error(
                message: I18n.t('active_confirmations.not_pending_so_dont_nag')
            )
            return
        end

        @confirmation.nag_count += 1
        @confirmation.save!
        ConfirmationMailer.email_nag(@confirmation).deliver_now!
        render_success @confirmation
    end

    # GET /active_confirmations/history
    # Fetches the history for past confirmations ordered by emailed_date
    def history
        render_success Confirmation.where(applicant_matching_datum: @applicant_matching_datum).order(
                           created_at: :desc
                       )
    end

    private

    def can_be_emailed
        @confirmation = @applicant_matching_datum.active_confirmation

        # Check state first
        #  - if accepted, don't change the state, but still send
        #  - if withdrawn or rejected, don't send
        if !@confirmation.present?
            render_error(message: I18n.t('active_confirmations.does_not_exist'))
            return false
        elsif @confirmation.withdrawn? || @confirmation.rejected?
            render_error(message: I18n.t('active_confirmations.invalid_confirmation'))
            return false
        end

        true
    end

    def find_applicant_matching_datum
        @applicant_matching_datum = ApplicantMatchingDatum.find(params[:applicant_matching_datum_id])
    end
end
