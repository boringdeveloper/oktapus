export const environment = {
  production: true,
    
  okta_client_id: '',
  okta_issuer: '',
  okta_pkce: true,
  okta_host: '',
  okta_redirect_uri: 'http://localhost:8100',
  okta_logout_uri: 'http://localhost:8100',
  okta_scopes: ['openid', 'profile', 'email'],
  okta_response_mode: 'query',

  okta_mobile_client_id: '',
  okta_mobile_redirect_uri: 'http://localhost:8100/signin',
  okta_mobile_logout_uri: 'http://localhost:8100/signout',
  okta_mobile_response_type: 'code',
  okta_mobile_scopes: ['openid', 'profile', 'email', 'offline_access', 'device_sso']
};
