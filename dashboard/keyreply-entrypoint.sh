#!/bin/sh
echo "window.appConfig = { AUTH0_DOMAIN: \"${AUTH0_DOMAIN}\", AUTH0_CLIENT_ID: \"${AUTH0_CLIENT_ID}\", RESPONSE_TYPE: \"${RESPONSE_TYPE}\" , REDIRECT_URI: \"${REDIRECT_URI}\", SERVER_BASE_URL: \"${SERVER_BASE_URL}\", FACEBOOK_APP_ID: \"${FACEBOOK_APP_ID}\";" > /app/config.js
exec /opt/bitnami/scripts/nginx/entrypoint.sh "$@"
exit $?
