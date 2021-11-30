import config from './config';

// Should load Facebook SDK once either on index or first permanent component
// using initFacebookSdk
// then call launchWhatsAppSignup() later wards

type FacebookInitParams = {
  appId: string;
  cookie: boolean;
  xfbml: boolean;
  version: string;
};

type LoginResponse = { authResponse: { accessToken: string } };
type BusinessCategory =
  | 'AUTO'
  | 'BEAUTY'
  | 'APPAREL'
  | 'EDU'
  | 'ENTERTAIN'
  | 'EVENT_PLAN'
  | 'FINANCE'
  | 'GROCERY'
  | 'GOVT'
  | 'HOTEL'
  | 'NONPROFIT'
  | 'PROF_SERVICES'
  | 'RETAIL'
  | 'TRAVEL'
  | 'RESTAURANT'
  | 'OTHER';
type SetupData = {
  business?: {
    name?: string;
    email?: string;
    website?: string;
    phone?: {
      code?: number;
      number?: string;
    };
    address?: {
      streetAddress1?: string;
      streetAddress2?: string;
      city?: string;
      state?: string;
      zipPostal?: string;
      country?: string;
    };
    timezone?: string;
  };
  phone?: {
    displayName?: string;
    category?: BusinessCategory;
    description?: string;
  };
};
type LoginParams = {
  scope: string;
  auth_type?: 'rerequest' | 'reauthenticate' | 'reauthorize';
  extras: {
    feature: string;
    setup?: SetupData;
  };
};
type LoginCallback = (response: LoginResponse) => void;
type FBLogin = (callback: LoginCallback, loginParams: LoginParams) => void;

type ApiResponse = {
  error: string;
  data: {
    granular_scopes: [{ scope: string; target_ids: string[] }];
  };
};
type ApiCallback = (response: ApiResponse) => void;
type FBApi = (callbackUrl: string, callback: ApiCallback) => void;

declare global {
  interface Window {
    fbAsyncInit(): void;
    FB: {
      init(params: FacebookInitParams): void;
      login: FBLogin;
      api: FBApi;
    };
    appConfig: {
      AUTH0_DOMAIN: string;
      AUTH0_CLIENT_ID: string;
      AUTH0_RESPONSE_TYPE: string;
      REDIRECT_URI: string;
      SERVER_BASE_URL: string;
      FACEBOOK_APP_ID: string;
      KEYREPLY_BUSINESS_ID: string;
    };
    fbq(trackName: string, trackType: string, options: { appId: string; feature: string }): void;
  }
}

export function initFacebookSdk() {
  // wait for facebook sdk to initialize before starting the react app
  window.fbAsyncInit = function () {
    console.log('FB');
    window.FB.init({
      appId: config.FACEBOOK_APP_ID,
      cookie: true,
      xfbml: true,
      version: 'v11.0',
    });
  };

  type FacebookElement = { src: string } & HTMLElement;
  // load facebook sdk script
  (function (d, s, id) {
    let js = <FacebookElement>d.getElementsByTagName(s)[0];
    const fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
      return;
    }
    js = <FacebookElement>d.createElement(s);
    js.id = id;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    fjs?.parentNode?.insertBefore(js, fjs);
  })(document, 'script', 'facebook-jssdk');
}

function waitForFbq(callback: () => void) {
  if (typeof window.fbq !== 'undefined') {
    callback();
  } else {
    setTimeout(function () {
      waitForFbq(callback);
    }, 100);
  }
}

// Returns Facebook access token that will be used in server
export function launchWhatsAppSignup(): Promise<string> {
  return new Promise((resolve, reject) => {
    waitForFbq(function () {
      window.fbq &&
        window.fbq('trackCustom', 'WhatsAppOnboardingStart', {
          appId: config.FACEBOOK_APP_ID,
          feature: 'whatsapp_embedded_signup',
        });
    });
    // Launch Facebook login
    console.log('FACEBOOK LOGIN TIME!');
    window.FB.login(
      function (response: LoginResponse) {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          resolve(accessToken);
        } else {
          reject('User cancelled login or did not fully authorize.');
        }
      },
      {
        // scope: 'public_profile,email', // Sanity check since always allowed
        scope: 'business_management,whatsapp_business_management',
        // Ensures user knows what he is doing
        // auth_type: 'reauthenticate',
        extras: {
          feature: 'whatsapp_embedded_signup',
        },
      },
    );
  });
}

// export function mockLaunchWhatsAppSignup(): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const newWindow = window.open('mockSignup', 'name', 'height=400,width=300');
//     newWindow!.onbeforeunload = function () {
//       resolve('TOKEN');
//     };
//   });
//}
