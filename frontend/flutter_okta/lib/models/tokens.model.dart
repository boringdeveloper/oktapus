class Tokens {
  final String accessToken;
  final String idToken;
  final String refreshToken;
  final String? deviceSecret;
  final String tokenType;
  final String scope;
  final int expiresIn;

  const Tokens({
    required this.accessToken,
    required this.idToken,
    required this.refreshToken,
    required this.deviceSecret,
    required this.tokenType,
    required this.scope,
    required this.expiresIn,
  });

  factory Tokens.fromJson(Map<String, dynamic> json) {
    return Tokens(
      accessToken: json['access_token'],
      idToken: json['id_token'],
      refreshToken: json['refresh_token'],
      deviceSecret: json['device_secret'],
      tokenType: json['token_type'],
      scope: json['scope'],
      expiresIn: json['expires_in'],
    );
  }
}
