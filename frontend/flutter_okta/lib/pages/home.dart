import 'package:flutter/material.dart';
import 'package:flutter_okta/pages/login.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Welcome'),
        actions: [
          TextButton.icon(
            onPressed: () => logout(),
            icon: const Icon((Icons.logout)),
            label: const Text('Logout'),
          ),
        ],
        actionsIconTheme: const IconThemeData(
          size: 30.0,
          color: Colors.white,
          opacity: 10.0,
        ),
        automaticallyImplyLeading: false,
      ),
    );
  }

  logout() {
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const LoginPage()),
      ModalRoute.withName('/'),
    );
  }
}
