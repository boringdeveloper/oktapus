import 'package:flutter_okta/models/user_claims.model.dart';

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
    this.deviceSecret,
    required this.tokenType,
    required this.scope,
    required this.expiresIn,
  });

  factory Tokens.fromJson(Map<String, dynamic> json) {
    return Tokens(
      accessToken: json['access_token'],
      idToken: json['id_token'],
      refreshToken: json['refresh_token'],
      deviceSecret: json['device_secret']!,
      tokenType: json['token_type'],
      scope: json['scope'],
      expiresIn: json['expires_in'],
    );
  }
}

class AbstractToken {
  final int expiresAt;
  final String authorizeUrl;
  final String scopes;
  final bool? pendingRemove;

  const AbstractToken({
    required this.expiresAt,
    required this.authorizeUrl,
    required this.scopes,
    this.pendingRemove,
  });
}

class AccessToken extends AbstractToken {
  final String accessToken;
  final UserClaims claims;
  final String tokenType;
  final String userinfoUrl;

  const AccessToken({
    required this.accessToken,
    required this.claims,
    required this.tokenType,
    required this.userinfoUrl,
    required super.expiresAt,
    required super.authorizeUrl,
    required super.scopes,
    super.pendingRemove,
  });

  factory AccessToken.fromJson(Map<String, dynamic> json) {
    return AccessToken(
      accessToken: json['accessToken'],
      tokenType: json['tokenType'],
      userinfoUrl: json['userinfoUrl'],
      claims: json['claims'],
      expiresAt: json['expiresAt'],
      authorizeUrl: json['authorizeUrl'],
      scopes: json['scopes'],
      pendingRemove: json['pendingRemove'],
    );
  }

  static Map<String, dynamic> toJson(AccessToken value) => {
        'accessToken': value.accessToken,
        'claims': UserClaims.toJson(value.claims),
        'tokenType': value.tokenType,
        'userinfoUrl': value.userinfoUrl,
        'expiresAt': value.expiresAt,
        'authorizeUrl': value.authorizeUrl,
        'scopes': value.scopes,
        'pendingRemove': value.pendingRemove,
      };
}

class RefreshToken extends AbstractToken {
  final String refreshToken;
  final String tokenUrl;
  final String issuer;

  const RefreshToken({
    required this.refreshToken,
    required this.tokenUrl,
    required this.issuer,
    required super.expiresAt,
    required super.authorizeUrl,
    required super.scopes,
    super.pendingRemove,
  });

  static Map<String, dynamic> toJson(RefreshToken value) => {
        'refreshToken': value.refreshToken,
        'tokenUrl': value.tokenUrl,
        'issuer': value.issuer,
        'expiresAt': value.expiresAt,
        'authorizeUrl': value.authorizeUrl,
        'scopes': value.scopes,
        'pendingRemove': value.pendingRemove,
      };
}

class IDToken extends AbstractToken {
  final String idToken;
  final UserClaims claims;
  final String issuer;
  final String clientId;

  const IDToken({
    required this.idToken,
    required this.claims,
    required this.issuer,
    required this.clientId,
    required super.expiresAt,
    required super.authorizeUrl,
    required super.scopes,
    super.pendingRemove,
  });

  factory IDToken.fromJson(Map<String, dynamic> json) {
    return IDToken(
      idToken: json['idToken'],
      claims: UserClaims.fromJson(json['claims']),
      issuer: json['issuer'],
      clientId: json['clientId'],
      expiresAt: json['expiresAt'],
      authorizeUrl: json['authorizeUrl'],
      scopes: json['scopes'],
      pendingRemove: json['pendingRemove'],
    );
  }

  static Map<String, dynamic> toJson(IDToken value) => {
        'idToken': value.idToken,
        'claims': UserClaims.toJson(value.claims),
        'issuer': value.issuer,
        'clientId': value.clientId,
        'expiresAt': value.expiresAt,
        'authorizeUrl': value.authorizeUrl,
        'scopes': value.scopes,
        'pendingRemove': value.pendingRemove,
      };
}
