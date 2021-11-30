import axios from 'axios';
import statusCodes from 'http-status-codes';
import config from '../config';
import { Me } from '../types';

// Function is dynamically added on initialization to prevent circular dependencies
// For updating react state
type UpdateLoginState = null | ((newEmail: null | Me) => void);
let updateLoginState: UpdateLoginState = null;
const setUpdateLoginState = (updateLoginStateFunction: UpdateLoginState) => {
  updateLoginState = updateLoginStateFunction;
};

const instance = axios.create({
  baseURL: `${config.SERVER_BASE_URL}/api`,
  // timeout: 10000,
  // required for making cross domain calls
  withCredentials: true,
});

// Add a response interceptor
instance.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    const PATHS_THAT_GET_IDENTITY = ['/login', '/me'];
    const hasIdentity =
      response?.data?.email && response?.config?.url && PATHS_THAT_GET_IDENTITY.includes(response.config.url);
    const requiresEmailVerification = response?.data?.requiresEmailVerification;
    if (hasIdentity && !requiresEmailVerification) {
      updateLoginState?.(<Me>{
        email: response.data.email,
        id: response.data.id,
        isAdmin: response.data.isAdmin,
        partnerId: response.data.partnerId,
        status: response.data.status,
      });
    }
    if (response.config.url === '/logout') {
      updateLoginState?.(null);
    }
    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    console.log(error?.response?.status);
    if (error?.response?.status === statusCodes.UNAUTHORIZED) {
      updateLoginState?.(null);
    }
    return Promise.reject(error);
  },
);

export { instance as axios, setUpdateLoginState };
