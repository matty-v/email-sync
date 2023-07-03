# build environment
FROM node:14.8.0-alpine AS build

WORKDIR /app

COPY ./src ./src
COPY tsconfig.json .
COPY package*.json ./

RUN npm install

RUN npm run build

# prod environment
FROM node:14.8.0-alpine
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

ENV PORT=3001
EXPOSE ${PORT}

CMD node ./dist/server.js
