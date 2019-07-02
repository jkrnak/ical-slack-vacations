FROM node:10-alpine

RUN apk --update --no-cache add ca-certificates

COPY ./package* ./

RUN npm ci

COPY . .

ENTRYPOINT [ "node", "src/index.js" ]
