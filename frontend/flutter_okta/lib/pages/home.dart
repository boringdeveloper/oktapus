import 'package:flutter/material.dart';
import 'package:flutter_okta/models/tokens.model.dart';
import 'package:flutter_okta/models/user_claims.model.dart';
import 'package:flutter_okta/pages/login.dart';
import 'package:flutter_okta/utilities/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import 'package:url_launcher/url_launcher.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String name = '';
  IDToken? idToken;

  @override
  void initState() {
    getUserData();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Welcome $name'),
        actions: [
          IconButton(
            onPressed: () => logout(),
            icon: const Icon((Icons.logout)),
          ),
        ],
        actionsIconTheme: const IconThemeData(
          size: 24.0,
          color: Colors.white,
          opacity: 10.0,
        ),
        automaticallyImplyLeading: false,
      ),
    );
  }

  logout() async {
    final logoutUrl = Uri(
      scheme: 'https',
      host: oktaConfig['host'],
      path: 'oauth2/default${endpoints['logout']}',
      queryParameters: {
        'client_id': oktaConfig['clientId'],
        'id_token_hint': idToken?.idToken,
        'post_logout_redirect_uri': oktaConfig['logoutUri']
      },
    );

    if (await canLaunchUrl(logoutUrl)) {
      await launchUrl(
        logoutUrl,
        mode: LaunchMode.externalApplication,
      );
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const LoginPage()),
      ModalRoute.withName('/login'),
    );
  }

  getUserData() async {
    final prefs = await SharedPreferences.getInstance();

    IDToken idTokenData =
        IDToken.fromJson(jsonDecode(prefs.getString('idToken')!));
    UserClaims userData = idTokenData.claims;

    setState(() {
      idToken = idTokenData;
      name = userData.name!;
    });
  }
}
