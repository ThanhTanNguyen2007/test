import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../logger';

type Auth0Tokens = {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: string;
};
type DecodedJwt = {
  email: string;
  email_verified: boolean;
  sub: string;
};

const exchangeCodeForToken = async (code: string) => {
  try {
    const res: { data: Auth0Tokens } = await axios.post(`${config.AUTH0_DOMAIN}/oauth/token`, {
      grant_type: 'authorization_code',
      client_id: config.AUTH0_CLIENT_ID,
      client_secret: config.AUTH0_CLIENT_SECRET,
      code,
      redirect_uri: config.AUTH0_CALLBACK_URL,
    });
    const decodedJwt = <DecodedJwt>jwt.decode(res.data.id_token);
    logger.info(`User logged in: ${decodedJwt.email} `);
    return decodedJwt;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

export { exchangeCodeForToken };
