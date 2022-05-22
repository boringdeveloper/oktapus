import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_okta/pages/home.dart';
import 'package:flutter_okta/utilities/utilities.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uni_links/uni_links.dart';
import 'package:url_launcher/url_launcher.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  Uri? _initialURI;
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
    var codeVerifier = getRandomString(43);
    var codeChallenge = encryptString(codeVerifier);

    print(codeVerifier);
    print(codeChallenge);

    final prefs = await SharedPreferences.getInstance();

    await prefs.setString('code_verifier', codeVerifier);
    await prefs.setString('code_challenge', codeChallenge);

    // const authorizeUrl = "https://dev-88557974.okta.com/oauth2/default/v1/authorize?client_id=0oabygpxgk9lXaMgF0h7&response_type=code&scope=openid&redirect_uri=yourApp%3A%2Fcallback&state=state-8600b31f-52d1-4dca-987c-386e3d8967e9&code_challenge_method=S256&code_challenge=qjrzSW9gMiUgpUvqgEPE4_-8swvyCtfOVvg55o5S_es";

    final authorizeUrl = Uri(
      scheme: 'https',
      host: 'dev-88557974.okta.com',
      path: 'oauth2/default/v1/authorize',
      queryParameters: {
        'client_id': '0oa51dt9j4AeK6eXP5d7',
        'response_type': 'code',
        'scope': 'openid profile email offline_access device_sso',
        'redirect_uri': 'https://okta.nickromero.dev/signin',
        'code_challenge_method': 'S256',
        'code_challenge': codeChallenge,
        'state': 'test'
      },
    );

    if (await canLaunchUrl(authorizeUrl)) {
      await launchUrl(
        authorizeUrl,
        mode: LaunchMode.externalApplication,
      );
    }

    // Navigator.push(
    //   context,
    //   MaterialPageRoute(builder: (context) => const HomePage()),
    // );
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
        setState(() {
          _currentURI = uri;
          _err = null;
        });
      }, onError: (Object err) {
        if (!mounted) {
          return;
        }
        debugPrint('Error occurred: $err');
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
}
