import config from '../../../config';

const createGraphUrl = (path: string, useAdminSystemUser = false) => {
  const graphUrl = new URL(config.FACEBOOK_GRAPH_BASE_URL);
  graphUrl.pathname = `v10.0/${path}`;
  if (useAdminSystemUser) {
    graphUrl.searchParams.set('access_token', config.FACEBOOK_ADMIN_SYSTEM_USER_ACCESS_TOKEN);
  } else {
    graphUrl.searchParams.set('access_token', config.FACEBOOK_SYSTEM_USER_ACCESS_TOKEN);
  }
  return graphUrl;
};

export default createGraphUrl;
