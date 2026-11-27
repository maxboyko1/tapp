# frozen_string_literal: true

namespace :offers do
    desc 'Email subscribed instructors offer activity from the last N seconds (default: 86400)'
    task :email_summaries, [:lookback_seconds] => :environment do |_task, args|
        lookback = Integer(args[:lookback_seconds] || 86_400)
        raise ArgumentError, 'lookback_seconds must be positive' unless lookback.positive?

        unless Rails.application.config.enable_emailing
            Rails.logger.info 'ENABLE_EMAILING is not true; skipping offer summaries'
            next
        end

        to_time = Time.zone.now
        since_time = to_time - lookback
        failures = []

        # Initiate email summary tasks for each instructor-position pair for which the instructor
        # has subscribed to updates
        InstructorPosition.where(is_subscribed: true)
                          .includes(:instructor, position: :session)
                          .find_each do |instructor_position|
            next if instructor_position.instructor.email.blank?

            begin
                OfferMailer.with(since_time: since_time, to_time: to_time)
                           .email_summary(instructor_position).deliver_now!
            rescue StandardError => e
                failures << instructor_position.id
                Rails.logger.error(
                    "Offer summary failed for InstructorPosition #{instructor_position.id}: #{e.class}: #{e.message}"
                )
            end
        end

        unless failures.empty?
            raise StandardError, "Offer summaries failed for InstructorPosition IDs: #{failures.join(', ')}"
        end
    end
end
