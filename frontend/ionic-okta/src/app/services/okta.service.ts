import { Injectable } from "@angular/core";
import { AccessToken, IDToken, OktaAuth, OktaAuthOptions, UserClaims } from "@okta/okta-auth-js";
import { Observable, Observer } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class OktaService {
    config: OktaAuthOptions = {
        issuer: environment.okta_issuer,
        clientId: environment.okta_client_id,
        redirectUri: environment.okta_redirect_uri,
        responseMode: 'query',
        pkce: environment.okta_pkce,
        scopes: ['openid', 'profile', 'email'],
        tokenManager: {
          storage: 'sessionStorage',
        },
        cookies: {
            secure: true,
            sameSite: 'none',
        }
    };
      
    authClient: OktaAuth = new OktaAuth(this.config);
    private _userInfo;

    $isAuthenticated: Observable<boolean>;
    private observer: Observer<boolean>;

    constructor() {
        this.$isAuthenticated = new Observable((observer: Observer<boolean>) => {
            this.observer = observer;
            this.isAuthenticated().then(val => {
                observer.next(val);
            })
        })
    }

    async isAuthenticated() {
        return !!(await this.authClient.tokenManager.get('accessToken'));
    }

    async oktaLogin() {
        await this.authClient.signInWithRedirect({
            scopes: this.config.scopes
        }).catch((err) => {
            console.log('Okta Sign In Failed', err);
        })
    }

    async handleAuthentication() {
        const tokens = await this.authClient.token.parseFromUrl();
        console.log('Retreived Okta Tokens', tokens);

        this.authClient.tokenManager.add('idToken', tokens.tokens.idToken as IDToken);
        this.authClient.tokenManager.add('accessToken', tokens.tokens.accessToken as AccessToken);

        if (await this.isAuthenticated()) {
            this.observer.next(true);
        }
    }

    async signOut() {
        await this.authClient.signOut();
        await this.authClient.revokeAccessToken();
    }
}