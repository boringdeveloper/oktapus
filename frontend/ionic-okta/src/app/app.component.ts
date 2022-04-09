import { Component, OnInit } from '@angular/core';
import { OktaService } from './services/okta.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    public oktaSvc: OktaService
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.oktaSvc.authClient.isLoginRedirect()) {
      await this.oktaSvc.handleAuthentication();
    }
  }
}
