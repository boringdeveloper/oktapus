import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';

const _chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890';
Random _rnd = Random.secure();

String getRandomString(int length) => String.fromCharCodes(Iterable.generate(
    length, (_) => _chars.codeUnitAt(_rnd.nextInt(_chars.length))));

String encryptString(String value) =>
    base64UrlEncode(utf8.encode(sha256.convert(utf8.encode(value)).toString()));
