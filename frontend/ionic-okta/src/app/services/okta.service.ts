import { Injectable } from "@angular/core";
import { AccessToken, IDToken, OktaAuth, OktaAuthOptions, TokenParams, UserClaims } from "@okta/okta-auth-js";
import { Observable, Observer } from "rxjs";
import { environment } from "src/environments/environment";
import { Platform } from '@ionic/angular';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';

declare let window: any;

@Injectable({ providedIn: 'root' })
export class OktaService {
    config: OktaAuthOptions = {
        issuer: environment.okta_issuer,
        clientId: environment.okta_client_id,
        redirectUri: environment.okta_redirect_uri,
        responseMode: environment.okta_response_mode,
        pkce: environment.okta_pkce,
        scopes: environment.okta_scopes,
        tokenManager: {
          storage: 'sessionStorage',
        },
        cookies: {
            secure: true,
            sameSite: 'none',
        }
    };

    mobileConfig: OktaAuthOptions = {
        issuer: environment.okta_issuer,
        clientId: environment.okta_mobile_client_id,
        redirectUri: environment.okta_mobile_redirect_uri,
        responseType: environment.okta_mobile_response_type,
        pkce: environment.okta_pkce,
        scopes: environment.okta_mobile_scopes,
        tokenManager: {
          storage: 'sessionStorage',
        },
    }

    authCodeFlowConfig: AuthConfig = {
        issuer: environment.okta_issuer,
        redirectUri: environment.okta_mobile_redirect_uri,
        clientId: environment.okta_client_id,
        responseType: environment.okta_mobile_response_type,
        scope: environment.okta_mobile_scopes.join(" "),
        strictDiscoveryDocumentValidation: false,
        showDebugInformation: environment.production ? false : true,

        openUri: (res) => {
            const urlParams = new URLSearchParams(res);
            const state: string = '';
            const nonce: string = urlParams.get('nonce');
            const code_challenge: string = urlParams.get('code_challenge');
            const code_challenge_method: string = urlParams.get('code_challenge_method');

            this.obtainAuthCode(state, nonce, code_challenge, code_challenge_method);
        }
    }
      
    authClient: OktaAuth = new OktaAuth(this.config);
    private _userInfo;

    $isAuthenticated: Observable<boolean>;
    private observer: Observer<boolean>;

    constructor(
        private platform: Platform,
        private http: HTTP,
        private oauthService: OAuthService
    ) {
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
        if (this.isMobile) {
            return new Promise((resolve, reject) => {
                this.configureAuthCodeFlowConfig();
                this.oauthService.loadDiscoveryDocumentAndTryLogin().then((res) => {
                    this.oauthService.initCodeFlow();
                }),
                (error) => {
                    reject();
                }
            });
        } else {
            await this.authClient.signInWithRedirect({
                scopes: this.config.scopes
            }).catch((err) => {
                console.log('Okta Sign In Failed', err);
            })
        }
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

    // Mobile Functions

    configureAuthCodeFlowConfig() {
        this.oauthService.configure(this.authCodeFlowConfig);
    }

    async obtainAuthCode(state: string, nonce: string, code_challenge: string, code_challenge_method: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const authorizeUrl = this.buildAuthoirzeUrl(state, nonce, code_challenge, code_challenge_method);
            const browser = window.cordova.InAppBrowser.open(
                authorizeUrl,
                '_blank',
                'hardwareback=no,zoom=no,hideurlbar=yes,hidenavigationbuttons=yes,location=no,toolbar=no,footer=no'
            );
            browser.addEventListener('loadstart', (event) => {
                if (event.url.indexOf(this.authCodeFlowConfig.redirectUri) > -1) {
                    browser.removeEventListener('exit', (event) => {});
                    browser.close();
                    
                    const params = event.url.split('?')[1].split('&');
                    const parsedParams = {};

                    for (let param of params) {
                        let keyValue = param.split('=');
                        parsedParams[keyValue[0]] = keyValue[1];
                    }
                    
                    console.log('parsed response parameters', parsedParams);
                    resolve(parsedParams);
                }
            });
            browser.addEventListener('exit', (event) => {
                reject('Okta sign in flow has been terminated');
            });
        });
    }

    async exchangeCodeForToken(grant_type: string = 'authorization_code', params, code_verifier?: string) {
        return new Promise((resolve, reject) => {
            try {
                const endpoint = `${this.authCodeFlowConfig.issuer}/v1/token`;
                const body = {
                    grant_type: grant_type,
                    client_id: this.authCodeFlowConfig,
                    code: encodeURIComponent(params.code),
                    code_verifier: code_verifier,
                    redirect_uri: this.authCodeFlowConfig.redirectUri
                }

                this.http.setHeader('*', 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                this.http.setHeader('*', 'Access-Control-Allow-Methods', 'POST');
                this.http.post(endpoint, body, {}).then((result: any) => {
                    this.saveTokens(result.data);
                    resolve(JSON.parse(result.data));
                }), (error) => {
                    reject(error);
                }
            } catch(e) {
                reject(e);
            }
        });
    }

    // utility and getters

    buildAuthoirzeUrl(state: string, nonce: string, code_challenge: string, code_challenge_method: string) : string {
        return `${this.authCodeFlowConfig.issuer}/v1/authorize?client_id=${this.authCodeFlowConfig.clientId}&redirect_uri=${this.authCodeFlowConfig.redirectUri}&response_type=${this.authCodeFlowConfig.responseType}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}&scope=${encodeURI(this.authCodeFlowConfig.scope)}&state=${state}&nonce=${nonce}`;
    }

    saveTokens(tokens): void {
        console.log('tokens', tokens);
        // if (tokens['access'])
        // this.authClient.tokenManager.add('idToken', tokens.tokens.idToken as IDToken);
        // this.authClient.tokenManager.add('accessToken', tokens.tokens.accessToken as AccessToken);
    }
    
    get isMobile() : boolean { return this.platform.is('mobile'); }
}