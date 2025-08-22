# frozen_string_literal: true

class ConfirmationMailer < ActionMailer::Base
    require 'html_to_plain_text'

    def email_letter(confirmation)
        populate_vars confirmation

        unless Rails.application.config.enable_emailing
            logger.warn "ENABLE_EMAILING is not true; skipping email to \"#{@email}\""
            return
        end

        debug_message = "Emailing Appointment Confirmation Letter to \"#{@email}\""
        logger.warn debug_message

        begin
            mail(
                to: @email,
                from: @ta_coordinator_email,
                subject: 'TA Appointment Hours Confirmation for Upcoming Fall/Winter Term'
            ) do |format|
                html = email_html
                # by calling format.html/format.text we can use our own templates
                # in place of the rails erd's.
                format.html { render inline: html }
                format.text do
                    render plain: HtmlToPlainText.plain_text(html)
                end
            end
        rescue Net::SMTPFatalError => e
            raise StandardError, "Error when #{debug_message} (#{e})"
        end
    end

    def email_nag(confirmation)
        populate_vars confirmation

        unless Rails.application.config.enable_emailing
            logger.warn "ENABLE_EMAILING is not true; skipping email to \"#{@email}\""
            return
        end

        debug_message = "Emailing Appointment Confimation Nag to \"#{@email}\""
        logger.warn debug_message

        begin
            mail(
                to: @email,
                from: @ta_coordinator_email,
                subject:
                    "Reminder #{@nag_count}: TA Appointment Hours Confirmation for Upcoming Fall/Winter Term"
            ) do |format|
                html = nag_email_html
                format.html { render inline: html }
                format.text do
                    render plain: HtmlToPlainText.plain_text(html)
                end
            end
        rescue Net::SMTPFatalError => e
            raise StandardError, "Error when #{debug_message} (#{e})"
        end
    end

    private

    def populate_vars(confirmation)
        @confirmation_service = ConfirmationService.new(confirmation: confirmation)
        @subs = @confirmation_service.subs
        @email = @subs[:email]
        @ta_coordinator_email = @subs[:ta_coordinator_email]
        @nag_count = @subs[:nag_count]
    end

    def email_html
        template = liquid_template('email_letter.html')
        template.render(@subs.stringify_keys)
    end

    def nag_email_html
        template = liquid_template('email_nag.html')
        template.render(@subs.stringify_keys)
    end

    def liquid_template(name)
        template_dir = Rails.root.join('app/views/confirmation_mailer/')
        template_file = "#{template_dir}/#{name}"
        # Verify that the template file is actually contained in the template directory
        unless Pathname.new(template_file).realdirpath.to_s.starts_with?(
                   template_dir.to_s
               )
            raise StandardError, "Invalid letter path #{template_file}"
        end

        Liquid::Template.parse(File.read(template_file))
    end
end
