# frozen_string_literal: true

class PositionMailer < ActionMailer::Base
    require 'html_to_plain_text'

    def email_ddah_reminder(position)
        generate_vars(position)

        unless Rails.application.config.enable_emailing
            logger.warn "ENABLE_EMAILING is not true; skipping email to \"#{@email}\""
            return
        end

        debug_message =
            "Emailing DDAH reminder for #{@position_code} to #{@instructor_emails}"
        logger.warn debug_message

        begin
            mail(
                to: @instructor_emails,
                from: @ta_coordinator_email,
                subject:
                    "DDAH Reminder for #{@position_code}"
            ) do |format|
                html = email_html
                # by calling format.html/format.text we can use our own templates
                # in place of the rails erd's.
                format.html { render inline: html }
                format.text { render plain: HtmlToPlainText.plain_text(html) }
            end
        rescue Net::SMTPFatalError => e
            raise StandardError, "Error when #{debug_message} (#{e})"
        end
    end

    private

    def email_html
        template = liquid_template('email_ddah_reminder.html')
        template.render(@subs.stringify_keys)
    end

    def generate_vars(position)
        @position = position
        @position_code = position.position_code
        @session = position.session
        @instructor_emails = position.instructors.map(&:email)
        @ta_coordinator_email = Rails.application.config.ta_coordinator_email

        @url =
            "#{Rails.application.config.base_url}/" \
                "?role=\"instructor\"&activeSession=#{@session.id}" \
                "#/positions/#{@position.id}/ddahs"

        @subs = {
            position: @position,
            instructor_emails: @instructor_emails,
            position_code: @position_code,
            session_name: @session.name,
            ta_coordinator_email: @ta_coordinator_email,
            url: @url
        }
    end

    def liquid_template(name)
        template_dir = Rails.root.join('app/views/position_mailer/')
        template_file = "#{template_dir}/#{name}"
        # Verify that the template file is actually contained in the template directory
        unless Pathname.new(template_file).realdirpath.to_s.starts_with?(
                   template_dir.to_s
               )
            raise StandardError, "Invalid DDAH reminder email template path #{template_file}"
        end

        Liquid::Template.parse(File.read(template_file))
    end
end
