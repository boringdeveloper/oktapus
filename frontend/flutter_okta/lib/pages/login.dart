import 'dart:async';
import 'dart:convert';
import 'dart:developer';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_okta/models/tokens.model.dart';
import 'package:flutter_okta/models/user_claims.model.dart';
import 'package:flutter_okta/pages/home.dart';
import 'package:flutter_okta/utilities/constants.dart';
import 'package:flutter_okta/utilities/utilities.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uni_links/uni_links.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';
import 'package:http/http.dart' as http;

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  Uri? _currentURI;
  Object? _err;

  StreamSubscription? _streamSubscription;

  @override
  void initState() {
    super.initState();
    _incomingLinkHandler();
  }

  @override
  void dispose() {
    _streamSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
        automaticallyImplyLeading: false,
      ),
      body: SizedBox(
        width: MediaQuery.of(context).size.width,
        child: Center(
          child: ElevatedButton(
            onPressed: () => login(),
            style: ElevatedButton.styleFrom(
              fixedSize: const Size.fromWidth(200),
              textStyle: const TextStyle(
                fontSize: 16.0,
                color: Colors.white,
              ),
            ),
            child: const Text('LOGIN'),
          ),
        ),
      ),
    );
  }

  login() async {
    FlutterSecureStorage storage = const FlutterSecureStorage();
    String? deviceSecret = await storage.read(key: 'OKTA_DEVICE_SECRET');

    if (deviceSecret != null) {
      debugPrint('deviceSecret: $deviceSecret');
    }

    var codeVerifier = getRandomString(43);
    var codeChallenge = generateCodeChallenge(codeVerifier);

    final prefs = await SharedPreferences.getInstance();

    await prefs.setString('code_verifier', codeVerifier);
    await prefs.setString('code_challenge', codeChallenge);

    final authorizeUrl = Uri(
      scheme: 'https',
      host: oktaConfig['host'],
      path: 'oauth2/default${endpoints['authorize']}',
      queryParameters: {
        'client_id': oktaConfig['clientId'],
        'response_type': 'code',
        'scope': 'openid profile email offline_access device_sso',
        'redirect_uri': oktaConfig['redirectUri'],
        'code_challenge_method': 'S256',
        'code_challenge': codeChallenge,
        'state': 'state-${const Uuid().v4()}'
      },
    );

    if (await canLaunchUrl(authorizeUrl)) {
      await launchUrl(
        authorizeUrl,
        mode: LaunchMode.externalApplication,
      );
    }
  }

  /// Handle incoming links - the ones that the app will receive from the OS
  /// while already started.
  void _incomingLinkHandler() {
    if (!kIsWeb) {
      // It will handle app links while the app is already started - be it in
      // the foreground or in the background.
      _streamSubscription = uriLinkStream.listen((Uri? uri) {
        if (!mounted) {
          return;
        }
        debugPrint('Received URI: $uri');

        var url = uri.toString();

        // check for query paramaters
        if (url.contains(oktaConfig['redirectUri'])) {
          if (url.contains('?')) {
            // Get Url Query Params
            var parsedParams = {};
            var params = url.split('?')[1].split('&');

            for (var param in params) {
              var keyValue = param.split('=');
              parsedParams[keyValue[0]] = keyValue[1];
            }

            exchangeCodeForToken('authorization_code', params: parsedParams);
          }
        }

        setState(() {
          _currentURI = uri;
          _err = null;
        });
      }, onError: (Object err) {
        if (!mounted) {
          return;
        }

        setState(() {
          _currentURI = null;
          if (err is FormatException) {
            _err = err;
          } else {
            _err = null;
          }
        });
      });
    }
  }

  exchangeCodeForToken(String grantType, {dynamic params}) async {
    final prefs = await SharedPreferences.getInstance();

    var url =
        'https://${oktaConfig['host']}/oauth2/default${endpoints['token']}';
    var body = {
      'grant_type': grantType,
      'client_id': oktaConfig['clientId'],
      'code': Uri.encodeComponent(params['code']),
      'code_verifier': prefs.getString('code_verifier'),
      'redirect_uri': oktaConfig['redirectUri']
    };

    var response = await http.post(
      Uri.parse(url),
      body: body,
      headers: {'cache-control': 'no-cache', 'accept': 'application/json'},
    );

    if (response.statusCode == 200) {
      var responseData = Tokens.fromJson(jsonDecode(response.body));

      await saveTokens(responseData);

      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const HomePage()),
        ModalRoute.withName('/home'),
      );
    }
  }

  Future<void> saveTokens(Tokens tokens) async {
    final prefs = await SharedPreferences.getInstance();

    String idToken = tokens.idToken;
    String accessToken = tokens.accessToken;
    String refreshToken = tokens.refreshToken;
    String? deviceSecret = tokens.deviceSecret;
    String scopes = tokens.scope;
    int expiresIn = tokens.expiresIn;
    String tokenType = tokens.tokenType;
    UserClaims jwt = UserClaims.fromJson(Jwt.parseJwt(idToken));
    int expiresAt = (DateTime.now().millisecondsSinceEpoch * 1000) + expiresIn;

    Map<String, dynamic> accessTokenObj = AccessToken.toJson(AccessToken(
      accessToken: accessToken,
      claims: jwt,
      tokenType: tokenType,
      userinfoUrl: oktaConfig['issuer'] + endpoints['userinfo'],
      expiresAt: expiresAt,
      authorizeUrl: oktaConfig['issuer'] + endpoints['authorize'],
      scopes: scopes,
    ));

    Map<String, dynamic> idTokenObj = IDToken.toJson(IDToken(
      idToken: idToken,
      claims: jwt,
      issuer: oktaConfig['issuer'],
      clientId: oktaConfig['clientId'],
      expiresAt: expiresAt,
      authorizeUrl: oktaConfig['issuer'] + endpoints['authorize'],
      scopes: scopes,
    ));

    Map<String, dynamic> refreshTokenObj = RefreshToken.toJson(RefreshToken(
      refreshToken: refreshToken,
      tokenUrl: oktaConfig['issuer'] + endpoints['token'],
      issuer: oktaConfig['issuer'],
      expiresAt: expiresAt,
      authorizeUrl: oktaConfig['issuer'] + endpoints['authorize'],
      scopes: scopes,
    ));

    await prefs.setString('accessToken', jsonEncode(accessTokenObj));
    await prefs.setString('idToken', jsonEncode(idTokenObj));
    await prefs.setString('refreshToken', jsonEncode(refreshTokenObj));

    if (deviceSecret != null) {
      debugPrint(deviceSecret);
      log(idToken);
      FlutterSecureStorage storage = const FlutterSecureStorage();
      await storage.write(key: 'OKTA_DEVICE_SECRET', value: deviceSecret);
      await storage.write(key: 'OKTA_ID_TOKEN', value: idToken);
    }
  }
}
