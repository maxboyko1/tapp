# frozen_string_literal: true

# Controller for LetterTemplates
class Api::V1::Admin::LetterTemplatesController < ApplicationController
    # GET /letter_templates
    def index
        render_success LetterTemplate.by_session(params[:session_id])
    end

    # POST /letter_templates
    def create
        @letter_template = LetterTemplate.find_by(id: params[:id])
        update && return if @letter_template

        # if we aren't updating, we need to create an letter_template
        # for the specified session.
        @session = Session.find(params[:session_id])
        template = @session.letter_templates.new(letter_template_params)
        render_on_condition(
            object: template,
            condition: proc { template.save! }
        )
    end

    # POST /letter_templates/delete
    def delete
        @letter_template = LetterTemplate.find_by(id: params[:id])

        render_on_condition(
            object: @letter_template,
            condition: proc { @letter_template.destroy! }
        )
    end

    # GET /available_letter_templates
    def available
        letter_dir = Rails.application.config.letter_template_dir
        files =
            Dir
                .glob("#{letter_dir}/*.html")
                .map { |entry| { template_file: entry.sub(letter_dir, '') } }
        render_success files
    end

    # GET /letter_templates/:id/view
    def view
        ensure_letter_template

        # load the appointment confirmation as a Liquid template
        template = Liquid::Template.parse(template_html)

        render_success template.render(sample_template_variables)
    end

    # GET /letter_templates/:id/download
    def download
        ensure_letter_template

        # Because JSON encoding can mess with file contents, we
        # encode everything as base64 before sending.
        render_success(
            file_name: @letter_template.template_file,
            mime_type: 'text/html',
            content: Base64.strict_encode64(template_html)
        )
    end

    # POST /letter_templates/upload
    def upload
        file_name = sanitize_filename(letter_template_upload_params[:file_name])
        full_path = template_file_full_path(file_name: file_name)

        if File.exist?(full_path)
            render_error(
                message: "Template with filename '#{file_name}' already exists"
            )
        end

        decode_base64_content =
            Base64.decode64(letter_template_upload_params[:content])
        File.open(full_path, 'wb') { |f| f.write(decode_base64_content) }

        available
    end

    private

    def letter_template_upload_params
        params.permit(:file_name, :content)
    end

    def letter_template_params
        params.permit(:template_file, :template_name, :session_id, :id)
    end

    def update
        render_on_condition(
            object: @letter_template,
            condition:
                proc { @letter_template.update!(letter_template_params) }
        )
    end

    def template_file_full_path(file_name: @letter_template.template_file)
        letter_dir = Rails.application.config.letter_template_dir
        template_file = "#{letter_dir}/#{file_name}"

        # Verify that the template file is actually contained in the template directory
        unless Pathname
                   .new(template_file)
                   .realdirpath
                   .to_s
                   .starts_with?(letter_dir)
            raise StandardError, "Invalid letter path #{template_file}"
        end

        template_file
    end

    def template_html
        File.read(template_file_full_path)
    end

    # Lookup the letter template specified in params and
    # throw an error if it doesn't exist
    def ensure_letter_template
        @letter_template = LetterTemplate.find_by(id: params[:id])
        unless @letter_template
            raise StandardError, "No template found with id '#{params[:id]}'."
        end
    end

    # When rendering a template, any undefined variable are rendered as blank.
    # This makes it hard to visualize what a template will actually look like.
    # This function provides reasonable substitutions for the template variables
    # so they will show up in a preview.
    def sample_template_variables
        # font.css and header.css contain base64-encoded data since we need all
        # data to be embedded in the HTML document
        letter_dir = Rails.application.config.letter_template_dir
        styles = {
            'style_font' => File.read("#{letter_dir}/font.css"),
            'style_header' => File.read("#{letter_dir}/header.css")
        }

        {
            first_name: 'John',
            last_name: 'Doe',
            email: 'doej@utoronto.ca',
            ta_coordinator_name: Rails.application.config.ta_coordinator_name,
            ta_coordinator_email: Rails.application.config.ta_coordinator_email,
            min_hours_owed: '60',
            max_hours_owed: '120',
            prev_hours_fulfilled: '10',
            signature: '',
            accepted_date: nil,
            withdrawn_date: nil,
            rejected_date: nil,
            status: 'pending'
        }.stringify_keys.merge(styles)
    end

    # from https://stackoverflow.com/questions/1939333/how-to-make-a-ruby-string-safe-for-a-filesystem
    def sanitize_filename(filename)
        # Split the name when finding a period which is preceded by some
        # character, and is followed by some character other than a period,
        # if there is no following period that is followed by something
        # other than a period (yeah, confusing, I know)
        fn = filename.split(/(?<=.)\.(?=[^.])(?!.*\.[^.])/m)

        # We now have one or two parts (depending on whether we could find
        # a suitable period). For each of these parts, replace any unwanted
        # sequence of characters with an underscore
        fn.map! { |s| s.gsub(/[^a-z0-9\-]+/i, '_') }

        # Finally, join the parts with a period and return the result
        fn.join '.'
    end
end
