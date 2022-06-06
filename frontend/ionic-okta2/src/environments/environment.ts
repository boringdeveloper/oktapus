export const environment = {
  production: false,
  
  okta_client_id: '0oa5acblq16IBka2G5d7',
  okta_issuer: 'https://dev-88557974.okta.com/oauth2/default',
  okta_pkce: true,
  okta_host: 'dev-88557974.okta.com',
  okta_redirect_uri: 'http://localhost:8100',
  okta_logout_uri: 'http://localhost:8100',
  okta_scopes: ['openid', 'profile', 'email'],
  okta_response_mode: 'query',

  okta_mobile_client_id: '0oa51dt9j4AeK6eXP5d7',
  okta_mobile_redirect_uri: 'http://localhost:8100/signin',
  okta_mobile_logout_uri: 'http://localhost:8100/signout',
  okta_mobile_response_type: 'code',
  okta_mobile_scopes: ['openid', 'profile', 'email', 'offline_access', 'device_sso']
}