import { Injectable } from "@angular/core";
import { AccessToken, IDToken, OktaAuth, OktaAuthOptions, RefreshToken, TokenParams, UserClaims } from "@okta/okta-auth-js";
import { Observable, Observer } from "rxjs";
import { environment } from "src/environments/environment";
import { Platform } from '@ionic/angular';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';

declare let window: any;
declare let cordova: any;

export interface iabResponse {
    success: boolean;
    message: string;
    data?: any;
};

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
        postLogoutRedirectUri: environment.okta_mobile_logout_uri,
        clientId: environment.okta_mobile_client_id,
        responseType: environment.okta_mobile_response_type,
        scope: environment.okta_mobile_scopes.join(" "),
        strictDiscoveryDocumentValidation: false,
        showDebugInformation: environment.production ? false : true,

        openUri: (res) => {
            const urlParams = new URLSearchParams(res);
            const state: string = `state-${this.uuidv4()}`;
            const nonce: string = urlParams.get('nonce');
            const code_challenge: string = urlParams.get('code_challenge');
            const code_challenge_method: string = urlParams.get('code_challenge_method');

            this.obtainAuthCode(state, nonce, code_challenge, code_challenge_method);
        }
    }
      
    authClient: OktaAuth;
    private _secureStorage;

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

        if (this.isMobile)
            this.authClient = new OktaAuth(this.mobileConfig);
        else
            this.authClient = new OktaAuth(this.config);

        this.initSecureStorage();
    }

    async isAuthenticated() {
        return !!(await this.authClient.tokenManager.get('accessToken'));
    }

    async oktaLogin() {
        if (this.isMobile) {
            this.getSecureStorage("OKTA_DEVICE_SECRET").then((deviceSecret) => {
                this.getSecureStorage("OKTA_ID_TOKEN").then((idToken) => {
                    const params = { deviceSecret: deviceSecret, idToken: idToken };
                    this.exchangeCodeForToken('urn:ietf:params:oauth:grant-type:token-exchange', params);
                });
            }).catch((error) => {
                this.configureAuthCodeFlowConfig();
                this.oauthService.loadDiscoveryDocumentAndTryLogin().then((res) => {
                    this.oauthService.initCodeFlow();
                });
            });
        } else {
            await this.authClient.signInWithRedirect({
                scopes: this.config.scopes
            }).catch((err) => {
                console.log('Okta Sign In Failed', err);
            });
        }
    }

    async handleAuthentication() {
        const tokens = await this.authClient.token.parseFromUrl();
        
        this.saveTokens(tokens);

        if (await this.isAuthenticated()) {
            this.observer.next(true);
        }
    }

    async signOut() {
        if (this.isMobile) {
            const idToken = await this.authClient.tokenManager.get('idToken');
            const logoutUrl = this.buildLogoutUrl(idToken.idToken);
            const event = await this.openInAppBrowser(logoutUrl, this.authCodeFlowConfig.postLogoutRedirectUri);

            if (event.success) {
                this.oauthService.logOut();
                this.authClient.tokenManager.clear();
                this.observer.next(await this.isAuthenticated());
            }
        } else {
            await this.authClient.signOut();
            await this.authClient.revokeAccessToken();
        }
    }

    // Mobile Functions

    configureAuthCodeFlowConfig() {
        this.oauthService.configure(this.authCodeFlowConfig);
    }

    async obtainAuthCode(state: string, nonce: string, code_challenge: string, code_challenge_method: string): Promise<any> {
        const authorizeUrl = this.buildAuthoirzeUrl(state, nonce, code_challenge, code_challenge_method);

        this.openInAppBrowser(authorizeUrl, this.authCodeFlowConfig.redirectUri).then((code) => {
            this.exchangeCodeForToken('authorization_code', code.data);
        });
    }

    async exchangeCodeForToken(grant_type, params?) {
        const endpoint = `${this.authCodeFlowConfig.issuer}/v1/token`;
        let body = {}

        if (grant_type == 'authorization_code') {
            body = {
                grant_type: grant_type,
                client_id: this.authCodeFlowConfig.clientId,
                code: encodeURIComponent(params.code),
                code_verifier: sessionStorage.getItem('PKCE_verifier'),
                redirect_uri: this.authCodeFlowConfig.redirectUri
            };
        } else if (grant_type == 'urn:ietf:params:oauth:grant-type:token-exchange') {
            body = {
                grant_type: grant_type,
                client_id: this.authCodeFlowConfig.clientId,
                actor_token: params.deviceSecret,
                actor_token_type: 'urn:x-oath:params:oauth:token-type:device-secret',
                subject_token: params.idToken,
                subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
                scope: 'openid offline_access',
                audience: 'api://default'
            };
        } else {
            throw new Error("Invalid grant type");
        }

        this.request(endpoint, body).then((result) => {
            this.saveTokens(result.data);

            if (this.isAuthenticated()) {
                this.observer.next(true);
            };
        });
    }

    async introspect(token: string, token_type: string, clientId?: string) {
        const endpoint = `${this.authCodeFlowConfig.issuer}/v1/introspect`;
        const body = {
            client_id: clientId!,
            token: token,
            token_type_hint: token_type
        };

        this.request(endpoint, body).then((result) => {
            console.log('introspect', result);
        });
    }

    // utility and getters

    buildAuthoirzeUrl(state: string, nonce: string, code_challenge: string, code_challenge_method: string) : string {
        return `${this.authCodeFlowConfig.issuer}/v1/authorize?client_id=${this.authCodeFlowConfig.clientId}&redirect_uri=${this.authCodeFlowConfig.redirectUri}&response_type=${this.authCodeFlowConfig.responseType}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}&scope=${encodeURI(this.authCodeFlowConfig.scope)}&state=${state}&nonce=${nonce}`;
    }

    buildLogoutUrl(id_token: string): string {
        return `${this.authCodeFlowConfig.issuer}/v1/logout?client_id=${this.authCodeFlowConfig.clientId}&id_token_hint=${id_token}&post_logout_redirect_uri=${this.authCodeFlowConfig.postLogoutRedirectUri}`;
    }

    request(endpoint: string, body: {}): Promise<any> {
        return new Promise((resolve, reject) => {
            this.http.setHeader('*', 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            this.http.setHeader('*', 'Access-Control-Allow-Methods', 'POST');
            this.http.post(endpoint, body, {}).then((result: any) => {
                resolve(JSON.parse(result));
            }), (error) => {
                reject(error);
            }
        });
    }

    saveTokens(tokens): void {
        if (this.isMobile) {
            const _tokens = JSON.parse(tokens);
            console.log('Retreived Okta Tokens', JSON.parse(tokens));

            if (_tokens.id_token) {
                const jwt = this.authClient.token.decode(_tokens.id_token);
                this.authClient.tokenManager.add('idToken', {
                    clientId: this.authCodeFlowConfig.clientId,
                    idToken: _tokens.id_token,
                    expiresAt: jwt.payload.exp,
                    scopes: _tokens.scope,
                    claims: jwt.payload,
                    authorizeUrl: '',
                    issuer: this.authCodeFlowConfig.issuer
                } as IDToken);
            }

            if (_tokens.access_token) {
                const jwt = this.authClient.token.decode(_tokens.id_token);
                this.authClient.tokenManager.add('accessToken', {
                    accessToken: _tokens.access_token,
                    claims: jwt.payload,
                    tokenType: _tokens.token_type,
                    userinfoUrl: this.authCodeFlowConfig.issuer + '/v1/userinfo',
                    expiresAt: Number(_tokens.expires_in) + Math.floor(Date.now() / 1000),
                    authorizeUrl: this.authCodeFlowConfig.issuer + '/v1/authorize',
                    scopes: _tokens.scope
                } as AccessToken);
            }

            if (_tokens.refresh_token) {
                this.authClient.tokenManager.add('refreshToken', {
                    refreshToken: _tokens.refresh_token,
                    scopes: _tokens.scope,
                    expiresAt: Number(_tokens.expires_in) + Math.floor(Date.now() / 1000),
                } as RefreshToken);
            }

            if (_tokens.device_secret) {
                this.setSecureStorage("OKTA_DEVICE_SECRET", _tokens.device_secret).then(() => {
                    this.setSecureStorage("OKTA_ID_TOKEN", _tokens.id_token);
                });
            }
        } else {
            console.log('Retreived Okta Tokens', tokens);
            this.authClient.tokenManager.add('idToken', tokens.tokens.idToken as IDToken);
            this.authClient.tokenManager.add('accessToken', tokens.tokens.accessToken as AccessToken);
        }
    }

    getUserInfo(): Promise<any> {
        if (this.isMobile) {
            return new Promise((resolve, reject) => {
                this.authClient.tokenManager.get('idToken').then((info) => {
                    resolve(info.claims);
                });
            });
        } else {
            return this.authClient.token.getUserInfo();
        }
    }

    openInAppBrowser(url: string, redirect_uri: string): Promise<iabResponse> {
        return new Promise((resolve, reject) => {
            console.log('Accessing url', url);
            const browser = window.cordova.InAppBrowser.open(
                url,
                '_blank',
                'hardwareback=no,zoom=no,hideurlbar=yes,hidenavigationbuttons=yes,location=no,toolbar=no,footer=no'
            );
            browser.addEventListener('loadstart', (event) => {
                if (event.url.indexOf(redirect_uri) == 0) {
                    browser.removeEventListener('exit', (event) => {});
                    browser.close();
                    
                    const parsedParams = {};
                    // check for query paramaters
                    if (event.url.indexOf('?') > -1) {
                        const params = event.url.split('?')[1].split('&');
    
                        for (let param of params) {
                            let keyValue = param.split('=');
                            parsedParams[keyValue[0]] = keyValue[1];
                        }
                    }
                    
                    resolve({ success: true, message: '', data: parsedParams });
                }
            });
            browser.addEventListener('exit', (event) => {
                reject({ success: false, message: 'Okta flow has been terminated' });
            });
        });
    }

    uuidv4(): string {
        return (<any>[1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    initSecureStorage() {
        this._secureStorage = new cordova.plugins.SecureStorage(
            function() {
                console.log('Success');
            },
            function(error) {
                console.log('Error ' + error);
            },
            "oktapus"
        );
    }

    getSecureStorage(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this._secureStorage.get(
                function(value) {
                    console.log('retrieved from secure storage', value);
                    resolve(value);
                },
                function(error) {
                    reject(error);
                  console.log("Error " + error);
                },
                key
            );
        });
    }

    setSecureStorage(key: string, value: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this._secureStorage.set(
                function(key) {
                    resolve(key);
                },
                function(error) {
                    reject(error);
                },
                key,
                value
            );
        });
    }
    
    get isMobile() : boolean {
        return !this.platform.is('desktop');
    }
}