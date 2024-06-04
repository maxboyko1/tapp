# frozen_string_literal: true

class ConfirmationService
    attr_reader :confirmation

    def initialize(confirmation:)
        @confirmation = confirmation
    end

    # generate subsitutions needed for the email templates
    def subs
        {
            first_name: @confirmation.first_name,
            last_name: @confirmation.last_name,
            # It is possible that the email from when the appointment confirmation was created is stale,
            # so send the offer to the applicant's current email.
            email: @confirmation.applicant_matching_datum.applicant.email,
            min_hours_owed: @confirmation.min_hours_owed,
            max_hours_owed: @confirmation.max_hours_owed,
            prev_hours_fulfilled: @confirmation.prev_hours_fulfilled,
            ta_coordinator_email: @confirmation.ta_coordinator_email,
            # TODO:  This seems too hard-coded.  Is there another way to get the route?
            # Note, we are using the `/hash` route proxying (instead of `#` hash)
            # to avoid issues with Shibboleth authentication
            # See details in routes.rb
            url:
                "#{Rails.application.config.base_url}/hash/public/letters/#{
                    @confirmation.url_token
                }",
            nag_count: @confirmation.nag_count,
            status_message: status_message,
            changes_summary: changes_from_previous
        }
    end

    # Get the differences between this confirmation and the immediately preceeding
    # confirmation (in terms of creation_date). If no prior confirmation exists, nil
    # is returned.
    def changes_from_previous
        previous =
            Confirmation.where(applicant_matching_datum_id: @confirmation.applicant_matching_datum_id).where(
                'created_at < ?',
                @confirmation.created_at
            ).order(withdrawn_date: :desc).first
        return nil if previous.nil?

        ret = []
        if @confirmation.prev_hours_fulfilled != previous.prev_hours_fulfilled
            ret.push "The previous hours fulfilled have been corrected from #{previous.prev_hours_fulfilled} to #{
                         @confirmation.prev_hours_fulfilled
                     }"
        end

        ret
    end

    private

    def status_message
        case @confirmation.status.to_sym
        when :withdrawn
            'Withdrawn'
        when :accepted
            "Accepted on #{@confirmation.accepted_date.strftime('%b %d, %Y')}"
        when :rejected
            "Rejected on #{@confirmation.rejected_date.strftime('%b %d, %Y')}"
        end
    end
end
