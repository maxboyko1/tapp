FROM node:20-alpine

ENV NODE_PATH=/node_modules
ENV PATH=$PATH:/node_modules/.bin
ENV NODE_OPTIONS=--max-old-space-size=16384

RUN mkdir /app
WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn

COPY . .