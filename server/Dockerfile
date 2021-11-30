FROM bitnami/node:14 as build-stage
ENV NODE_ENV development

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --pure-lockfile
COPY . .
RUN npx prisma generate
RUN yarn build

# production stage
FROM bitnami/node:14 as production-stage
ENV NODE_ENV production

COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/node_modules /app/node_modules
COPY --from=build-stage /app/prisma /app/prisma
WORKDIR /app

EXPOSE 4000
CMD [ "node", "app.js" ]
