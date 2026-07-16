# frozen_string_literal: true

class WageChunkFormattingService
    RETURNING_VALUES = %w[id hours rate start_date end_date].freeze

    attr_reader :assignment
    attr_accessor :wage_chunks

    def initialize(assignment:)
        @assignment = assignment
        @wage_chunks = assignment.wage_chunks
    end

    def pay_period_description
        formatted_chunks =
            rate_chunks.map do |chunk|
                start_date = format_long_date(chunk[:start_date])
                end_date = format_long_date(chunk[:end_date])
                hours = chunk[:hours]
                rate = format('%.2f', chunk[:rate])

                "#{hours} hours at $#{rate}/hour from #{start_date} to #{
                    end_date
                }"
            end
        formatted_chunks.to_sentence
    end

    private

    # Get a sorted list of "rate chunks". That is,
    # take all wage-chunks that have the same number of hours
    # in them and collapse them, accumulating their hours. Return
    # a list of hashes that look like
    # { start_date: ..., end_date: ..., hours: ..., rate: ...}
    def rate_chunks
        rates = {}
        @wage_chunks.each do |wage_chunk|
            rate = wage_chunk.rate
            rates[rate] ||= []
            rates[rate] << wage_chunk
        end

        rate_windows = {}
        rates.entries.each do |rate, chunks|
            start_date = chunks.map(&extract(:start_date)).compact.min
            end_date = chunks.map(&extract(:end_date)).compact.max
            hours = chunks.map(&:hours).sum
            rate_windows[rate] = {
                start_date: start_date || fallback_start_date,
                end_date: end_date || fallback_end_date,
                hours: hours,
                rate: rate
            }
        end

        rate_windows.values.sort_by { |chunk| chunk[:start_date] || Time.zone.at(0) }
    end

    # Helper function to be able to map over arrays of hashes
    # taken from https://stackoverflow.com/questions/20179636/ruby-using-the-methodname-shortcut-from-array-mapmethodname-for-hash-key
    def extract(key)
        ->(h) { h[key] }
    end

    def fallback_start_date
        assignment.start_date || assignment.position&.start_date
    end

    def fallback_end_date
        assignment.end_date || assignment.position&.end_date
    end

    def format_long_date(value)
        return 'Unknown date!' unless value.present?

        I18n.l(value.to_date, format: :long)
    end
end
