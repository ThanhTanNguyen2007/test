FROM bitnami/node:14.16.1 as build-stage
COPY package.json yarn.lock /app/
WORKDIR /app
RUN yarn --pure-lockfile
COPY . .
RUN yarn build

FROM bitnami/nginx:1.20 as production-stage
COPY --from=build-stage /app/build /app
COPY keyreply-entrypoint.sh /app
ENTRYPOINT ["/app/keyreply-entrypoint.sh"]
CMD ["/opt/bitnami/scripts/nginx/run.sh"]
