Map<String, dynamic> oktaConfig = {
  'host': 'dev-88557974.okta.com',
  'clientId': '0oa51dt9j4AeK6eXP5d7',
  'redirectUri': 'https://okta.nickromero.dev/signin',
  'issuer': 'https://dev-88557974.okta.com/oauth2/default',
  'logoutUri': 'https://okta.nickromero.dev/signout',
};

Map<String, String> endpoints = {
  'authorize': '/v1/authorize',
  'token': '/v1/token',
  'userinfo': '/v1/userinfo',
  'logout': '/v1/logout',
};
