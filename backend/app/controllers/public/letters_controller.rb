# frozen_string_literal: true

class Public::LettersController < ActionController::Base
    include Response
    include TransactionHandler

    # /public/letters/<id>
    def show
        return unless valid_confirmation?(url_token: show_params[:id])

        # for PDF and HTML rendering, we start by rendering the letter as an html document
        rendered = get_letter_html(@confirmation)
        if !show_params[:format].blank? &&
               show_params[:format].downcase == 'pdf'
            pdf_name = "appointment-letter-#{@confirmation.first_name}-#{@confirmation.last_name}"
            render pdf: pdf_name, inline: rendered
            return
        end

        render(inline: rendered)
    end

    # /public/letters/<letter_id>/accept
    def accept
        return unless valid_confirmation?(url_token: params[:letter_id])

        unless @confirmation.can_accept?
            render_error(
                message:
                    'Cannot accept an appointment confirmation that is already accepted/rejected/withdrawn'
            ) && return
        end

        start_transaction_and_rollback_on_exception do
            @confirmation.signature = params[:signature]
            @confirmation.accepted!
            @confirmation.save!
        end
        render_success {}
    end

    # /public/letters/<letter_id>/reject
    def reject
        return unless valid_confirmation?(url_token: params[:letter_id])

        unless @confirmation.can_reject?
            render_error(
                message:
                    'Cannot reject an appointment confirmation that is already accepted/rejected/withdrawn'
            ) && return
        end

        start_transaction_and_rollback_on_exception do
            @confirmation.rejected!
            @confirmation.save!
        end
        render_success {}
    end

    # /public/letters/<letter_id>/view
    def view
        return unless valid_confirmation?(url_token: params[:letter_id])

        # render the view confirmation template as a liquid template
        template_root = Rails.root.join('app/views/letters/')
        template_file = template_root.join('view-confirmation.html')
        template = Liquid::Template.parse(File.read(template_file))

        # We want everything to be served as a single HTML file with
        # scripts and css included. However, this is annoying in development.
        # To avoid additional build steps (like webpack, etc.), we just use
        # Liquid templates to stuff the css and JS directly into the html.
        header_subs = {
            'scripts' => File.read(template_root.join('view-confirmation.js')),
            'styles' => File.read(template_root.join('view-confirmation.css'))
        }

        render(inline: template.render(confirmation_substitutions.merge(header_subs)))
    end

    # /public/letters/<letter_id>/details
    def details
        return unless valid_confirmation?(url_token: params[:letter_id])

        render json: { status: 'success', payload: confirmation_substitutions }
    end

    private

    def show_params
        params.permit(:id, :format)
    end

    def get_letter_html(confirmation)
        letter_dir = Rails.application.config.letter_template_dir
        template_file = "#{letter_dir}/#{confirmation.letter_template}"
        # Verify that the template file is actually contained in the template directory
        unless Pathname.new(template_file).realdirpath.to_s.starts_with?(
                   letter_dir
               )
            raise StandardError, "Invalid letter path #{template_file}"
        end

        # load the confirmation as a Liquid template
        template = Liquid::Template.parse(File.read(template_file))
        # font.css and header.css contain base64-encoded data since we need all
        # data to be embedded in the HTML document
        styles = {
            'style_font' => File.read("#{letter_dir}/font.css"),
            'style_header' => File.read("#{letter_dir}/header.css")
        }

        subs = confirmation_substitutions(confirmation: confirmation).merge(styles).stringify_keys
        template.render(subs)
    end

    # Prepare a hash to be used by a Liquid
    # template based on the confirmation
    def confirmation_substitutions(confirmation: @confirmation)
        {
            first_name: confirmation.first_name,
            last_name: confirmation.last_name,
            email: confirmation.email,
            ta_coordinator_name: confirmation.ta_coordinator_name,
            ta_coordinator_email: confirmation.ta_coordinator_email,
            min_hours_owed: confirmation.min_hours_owed,
            max_hours_owed: confirmation.max_hours_owed,
            prev_hours_fulfilled: confirmation.prev_hours_fulfilled,
            signature: confirmation.signature,
            date:
                confirmation.emailed_date&.in_time_zone('Eastern Time (US & Canada)')
                    &.to_date,
            accepted_date: confirmation.accepted_date,
            withdrawn_date: confirmation.withdrawn_date,
            rejected_date: confirmation.rejected_date,
            status: confirmation.status,
            url_token: confirmation.url_token
        }.stringify_keys
    end

    # Tests to see if a valid confirmation exists corresponding to the specified
    # url token. Will render a 404 if not found. Should be used as
    #    return unless valid_confirmation?(...)
    #
    # Stores the found confirmation in `@confirmation`
    def valid_confirmation?(url_token: nil)
        confirmation = Confirmation.find_by_url_token(url_token)

        unless confirmation
            render status: 404, inline: "No confirmation found with id='#{url_token}'"
            return false
        end

        @confirmation = confirmation
    end
end
