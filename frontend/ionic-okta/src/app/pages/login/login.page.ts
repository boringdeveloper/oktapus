import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OktaService } from 'src/app/services/okta.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  subscription: Subscription = new Subscription();

  constructor(
    private oktaSvc: OktaService,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscription.add(this.oktaSvc.$isAuthenticated.subscribe((auth) => {
      if (auth) {
        this.router.navigate(['/home']);
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  login() {
    this.oktaSvc.oktaLogin();
  }
}
