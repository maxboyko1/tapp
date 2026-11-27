# wkhtmltopdf 0.12.6 (with patched Qt) built for Alpine 3.24. This is a stopgap until PDF
# generation moves to Gotenberg; keep its Alpine version in sync with the Ruby base image below.
FROM surnet/alpine-wkhtmltopdf:3.24.3-0.12.6-full AS wkhtmltopdf_image
FROM ruby:3.3.14-alpine3.24

# Add `tzdata` because the Gemfile doesn't successfully add the dependency via geminstall.
# Add `less` because the ruby console attempts to call `less` and errors when it doesn't exist.
# `libpq-dev` is needed to build the `pg` Gem. `postgresql18-client` provides `pg_dump`/`pg_restore`
# for the snapshot Rake tasks
RUN apk add --no-cache build-base \
  nodejs \
  libpq-dev \
  tzdata \
  graphviz \
  postgresql18-client \
  less \
  shared-mime-info

# Runtime libraries and fonts needed by wkhtmltopdf
RUN apk add --no-cache \
  libgcc libstdc++ libx11 libxrender libxext libssl3 ca-certificates fontconfig freetype \
  font-dejavu font-droid font-freefont font-liberation

COPY --from=wkhtmltopdf_image /bin/wkhtmltopdf /bin/

RUN mkdir /app
WORKDIR /app

COPY Gemfile Gemfile.lock ./

RUN bundle install --jobs 8

COPY . ./
