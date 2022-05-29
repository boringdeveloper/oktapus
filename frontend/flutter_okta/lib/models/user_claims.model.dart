class UserClaims {
  final int? authTime;
  final String? aud;
  final String? email;
  final bool? emailVerified;
  final int? exp;
  final String? familyName;
  final String? givenName;
  final int? iat;
  final String? iss;
  final String? jti;
  final String? locale;
  final String? name;
  final String? nonce;
  final String? preferredUsername;
  final String sub;
  final int? updatedAt;
  final int? ver;
  final String? zoneinfo;
  final String? atHash;

  const UserClaims({
    this.authTime,
    this.aud,
    this.email,
    this.emailVerified,
    this.exp,
    this.familyName,
    this.givenName,
    this.iat,
    this.iss,
    this.jti,
    this.locale,
    this.name,
    this.nonce,
    this.preferredUsername,
    required this.sub,
    this.updatedAt,
    this.ver,
    this.zoneinfo,
    this.atHash,
  });

  factory UserClaims.fromJson(Map<String, dynamic> json) {
    return UserClaims(
      authTime: json['authTime'],
      aud: json['aud'],
      email: json['email'],
      emailVerified: json['emailVerified'],
      exp: json['exp'],
      familyName: json['familyName'],
      givenName: json['givenName'],
      iat: json['iat'],
      iss: json['iss'],
      jti: json['jti'],
      locale: json['locale'],
      name: json['name'],
      nonce: json['nonce'],
      preferredUsername: json['preferredUsername'],
      sub: json['sub'],
      updatedAt: json['updatedAt'],
      ver: json['ver'],
      zoneinfo: json['zoneinfo'],
      atHash: json['atHash'],
    );
  }

  static Map<String, dynamic> toJson(UserClaims value) => {
        'authTime': value.authTime,
        'aud': value.aud,
        'email': value.email,
        'emailVerified': value.emailVerified,
        'exp': value.exp,
        'familyName': value.familyName,
        'givenName': value.givenName,
        'iat': value.iat,
        'iss': value.iss,
        'jti': value.jti,
        'locale': value.locale,
        'name': value.name,
        'nonce': value.nonce,
        'preferredUsername': value.preferredUsername,
        'sub': value.sub,
        'updatedAt': value.updatedAt,
        'ver': value.ver,
        'zoneinfo': value.zoneinfo,
        'atHash': value.atHash,
      };
}
