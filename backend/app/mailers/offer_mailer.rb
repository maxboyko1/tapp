# frozen_string_literal: true

class OfferMailer < ActionMailer::Base
    require 'html_to_plain_text'

    def email_summary(
        instructor_position,
        lookback: 24.hours,
        since_time: nil,
        to_time: Time.zone.now
    )
        instructor = instructor_position.instructor
        position = instructor_position.position

        unless Rails.application.config.enable_emailing
            logger.warn "ENABLE_EMAILING is not true; skipping email to \"#{instructor.email}\""
            return
        end

        # Build summary of offer activity within the lookback period, abort early if there was none
        activity_summary =
            OfferService.new(position: position).activity_summary(
                lookback: lookback,
                since_time: since_time,
                to_time: to_time
            )
        return if activity_summary.values.all?(&:empty?)

        @subs = activity_summary.merge(
                instructor_name:
                    "#{instructor.first_name} #{instructor.last_name}".strip,
                position_code: position.position_code,
                position_title: position.position_title,
                session_name: position.session.name,
                desired_num_assignments: position.desired_num_assignments,
                accepted_num_assignments:
                    position.assignments.joins(:active_offer)
                            .merge(Offer.accepted).count
            )

        mail(
            to: instructor.email,
            from: Rails.application.config.ta_coordinator_email,
            subject:
                "TA Offer Activity Summary for #{position.position_code}"
        ) do |format|
            html = summary_email_html
            format.html { render inline: html }
            format.text do
                render plain: HtmlToPlainText.plain_text(html)
            end
        end
    end

    def email_contract(offer)
        populate_vars offer

        unless Rails.application.config.enable_emailing
            logger.warn "ENABLE_EMAILING is not true; skipping email to \"#{@email}\""
            return
        end

        debug_message = "Emailing #{@position_code} Offer to \"#{@email}\""
        logger.warn debug_message

        begin
            mail(
                to: @email,
                from: @ta_coordinator_email,
                subject: "TA Position Offer for #{@position_code}"
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

    def email_nag(offer)
        populate_vars offer

        unless Rails.application.config.enable_emailing
            logger.warn "ENABLE_EMAILING is not true; skipping email to \"#{@email}\""
            return
        end

        debug_message = "Emailing #{@position_code} Offer Nag to \"#{@email}\""
        logger.warn debug_message

        begin
            mail(
                to: @email,
                from: @ta_coordinator_email,
                subject:
                    "Reminder #{@nag_count}: TA Position Offer for #{
                        @position_code
                    }"
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

    def email_reject_notification(offer, rejection_reason: nil)
        populate_vars offer, rejection_reason: rejection_reason

        unless Rails.application.config.enable_emailing
            logger.warn "ENABLE_EMAILING is not true; skipping email to \"#{@ta_coordinator_email}\""
            return
        end

        debug_message = "Emailing #{@position_code} Offer Reject Notification to \"#{@ta_coordinator_email}\""
        logger.warn debug_message

        begin
            mail(
                to: [@email, @ta_coordinator_email],
                from: @ta_coordinator_email,
                subject:
                    "TA Position Offer Rejected for #{@position_code}"
            ) do |format|
                html = reject_notification_email_html
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

    def populate_vars(offer, rejection_reason: nil)
        @offer_service = OfferService.new(offer: offer)
        @subs = @offer_service.subs
        @position_code = @subs[:position_code]
        @email = @subs[:email]
        @ta_coordinator_email = @subs[:ta_coordinator_email]
        @nag_count = @subs[:nag_count]
        @rejected_date = @subs[:rejected_date]
        @session_name = @subs[:session_name]
        @rejection_reason = rejection_reason
        @subs[:rejection_reason] = format_rejection_reason(rejection_reason)
    end

    def format_rejection_reason(reason_code)
        case reason_code
        when "not_interested"
            "I am no longer interested in being a TA for the semester."
        when "other_course"
            "I am hoping to get an offer for a different course for which I have equal or higher preference."
        else
            nil
        end
    end

    def email_html
        template = liquid_template('email_contract.html')
        template.render(@subs.stringify_keys)
    end

    def nag_email_html
        template = liquid_template('email_nag.html')
        template.render(@subs.stringify_keys)
    end

    def reject_notification_email_html
        template = liquid_template('email_reject_notification.html')
        template.render(@subs.stringify_keys)
    end

    def summary_email_html
        template = liquid_template('email_summary.html')
        template.render(@subs.stringify_keys)
    end

    def liquid_template(name)
        template_dir = Rails.root.join('app/views/offer_mailer/')
        template_file = "#{template_dir}/#{name}"
        # Verify that the template file is actually contained in the template directory
        unless Pathname.new(template_file).realdirpath.to_s.starts_with?(
                   template_dir.to_s
               )
            raise StandardError, "Invalid contract path #{template_file}"
        end

        Liquid::Template.parse(File.read(template_file))
    end
end
