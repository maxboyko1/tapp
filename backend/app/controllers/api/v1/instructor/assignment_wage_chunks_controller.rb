# frozen_string_literal: true

class Api::V1::Instructor::AssignmentWageChunksController < ApplicationController
    before_action :find_instructor, :find_assignment

    # GET /wage_chunks
    def index
        render_success([]) && return unless @active_instructor || @is_admin

        render_success @assignment.wage_chunks
    end

    private

    def find_instructor
        active_user = ActiveUserService.active_user request
        admin_utorids = Rails.configuration.always_admin
        @is_admin = admin_utorids.include?(active_user.utorid)
        @active_instructor = Instructor.find_by(utorid: active_user.utorid)
    end

    def find_assignment
        @assignment = if @is_admin
                          Assignment.find(params[:assignment_id])
                      elsif @active_instructor
                          Assignment.joins(position: :instructors)
                                        .where(position: { instructors: @active_instructor })
                                        .find(params[:assignment_id])
                      end
    end
end
