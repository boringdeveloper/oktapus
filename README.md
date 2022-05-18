# oktapus
Playing around in implementing Okta with different technologies.

### Overview

**Frontend**
- Ionic Framework Web & App
- Flutter (To Do)

**Backend**
- Node.js (To Do)

**Features**
- OIDC Auth Flow
- SSO (To Do)
- Registration (To Do)
- Account Management (To Do)

<br />

### Setup the Project

Clone the Project

```bash
  $ git clone https://github.com/boringdeveloper/oktapus.git
```

Sign up for a free [Okta Developer Account](https://developer.okta.com/signup/).

Create a new Application

**Web (Ionic Framework)**
  1. Go to **Applications > Applications**
  2. Click **Create App Integration**
  3. Select **OIDC - Open ID Connect**, then select **Single-Page Application**, then click **Next**
  4. Enter your **Application Name**
  5. For the **Grant Type**, select **Authorization Code**
  6. For the **Sign-in redirect URIs**, add **http://localhost:8100**
  7. For the **Sign-out redirect URIs**, add **http://localhost:8100**
  8. For **Controlled Access**, choose **Allow everyone in your organization to access** for now

**App (Ionic Framework)**
  1. Go to **Applications > Applications**
  2. Click **Create App Integration**
  3. Select **OIDC - Open ID Connect**, then select **Native Application**, then click **Next**
  4. Enter your **Application Name**
  5. For the **Grant Type**, select **Authorization Code** and **Refresh Token**
  6. For the **Sign-in redirect URIs**, add **http://localhost:8100/signin**
  7. For the **Sign-out redirect URIs**, add **http://localhost:8100/signout**
  8. For **Controlled Access**, choose **Allow everyone in your organization to access** for now

<br />

### Frontend

#### Ionic Framework
<details>
  <summary>Ionic Info</summary>
  
  Ionic:

    Ionic CLI                     : 6.19.1 (/usr/local/lib/node_modules/@ionic/cli)
    Ionic Framework               : @ionic/angular 6.0.15
    @angular-devkit/build-angular : 13.2.6
    @angular-devkit/schematics    : 13.2.6
    @angular/cli                  : 13.2.6
    @ionic/angular-toolkit        : 6.1.0

  Cordova:

     Cordova CLI       : 11.0.0
     Cordova Platforms : android 10.1.2
     Cordova Plugins   : cordova-plugin-ionic-keyboard 2.2.0, cordova-plugin-ionic-webview 5.0.0, (and 6 other plugins)

  Utility:

     cordova-res                          : not installed globally
     native-run (update available: 1.6.0) : 1.5.0

  System:

     NodeJS : v16.15.0 (/usr/local/bin/node)
     npm    : 8.5.5
     OS     : macOS Monterey
     Xcode  : Xcode 13.3.1 Build version 13E500a
</details>

Built and tested for:
- [x] Web
- [x] Android
- [ ] iOS

#### Setup

Install dependencies
```bash
  $ cd frontend/ionic-okta
  $ npm install
```

Open the file `src/environments/environments.ts` and update the following values;
  1. `okta_client_id` : Okta web application Client ID
  2. `okta_issuer` : Copy the **Issuer URI** from **Okta Dashboard** go to **Security > API**
  3. `okta_host` : Copy the **Okta Domain** from your Okta web application's _General_ details
  4. `okta_mobile_client_id` : Okta native or mobile application Client ID

Build the project

For Web
```bash
  $ ionic serve
```

For Android

Connect your android device or open an android simulator. Then run the following command
```bash
  $ ionic cordova run android --list
```

From the command above, get your device's or simulator's target id. Then run this command
```bash
  $ ionic cordova run android --target=target_id
```
