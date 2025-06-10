# frozen_string_literal: true

class Api::V1::Admin::PositionsController < ApplicationController
    before_action :store_params
    before_action :find_position, only: %i[delete create]

    # GET /positions/all
    def all
        @positions = Position.all
        render_success @positions
    end

    # POST /positions
    def create
        upsert
    end

    # POST /positions/delete
    def delete
        render_on_condition(
            object: @position, condition: proc { @position.destroy! }
        )
    end

    private

    # This method may be manually called from other controllers. Because
    # of that, it doesn't render, instead leaving rendering up to the caller
    def upsert
        # update the position if we have one
        if @position
            start_transaction_and_rollback_on_exception do
                service = PositionService.new(position: @position)
                service.update(params: position_params)
            end
            # create a new position if one doesn't currently exist
        else
            start_transaction_and_rollback_on_exception do
                service =
                    PositionService.new(params: position_params.except(:id))
                service.perform
                @position = service.position
            end
        end

        render_success @position
    end

    def find_position
        @position = Position.find(params[:id])
    end

    def store_params
        @params = params
    end

    def position_params
        filtered_params =
            params.slice(
                :id,
                :position_code,
                :position_title,
                :hours_per_assignment,
                :start_date,
                :end_date,
                :session_id,
                :contract_template_id,
                :desired_num_assignments,
                :current_enrollment,
                :current_waitlisted,
                :duties,
                :qualifications,
                :custom_questions,
                :instructor_ids
            ).permit!

        # Moving forward, custom_questions for a position will be imported in the format of
        # an ["An", "Array", "Like", "This"], from which we make a JSON object using the helper
        # below. Support for the old import-via-hash format is included here for completeness,
        # though the UI for working with this format has now been removed.
        if filtered_params[:custom_questions].is_a?(Array)
            filtered_params[:custom_questions] =
                make_questions_json_from_array(filtered_params[:custom_questions])
        elsif filtered_params[:custom_questions].is_a?(Hash)
            filtered_params[:custom_questions] =
                filtered_params[:custom_questions].to_hash.deep_stringify_keys
        end

        if params[:instructor_ids].present?
            filtered_params[:instructor_ids] =
                params[:instructor_ids]
        end

        filtered_params
    end

    def make_questions_json_from_array(questions)
        {
            elements: questions.map do |question|
                { type: 'comment', name: question }
            end
        }
    end
end
