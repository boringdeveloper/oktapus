import 'package:flutter/material.dart';
import 'package:flutter_okta/pages/home.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
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

  login() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const HomePage()),
    );
  }
}
