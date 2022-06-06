import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OktaService } from 'src/app/services/okta.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  subscription: Subscription = new Subscription();
  userInfo;

  constructor(
    private oktaSvc: OktaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(this.oktaSvc.$isAuthenticated.subscribe((auth) => {
      if (!auth) {
        this.router.navigate(['/login']);
      }
    }));
    
    // Get User Info
    this.oktaSvc.getUserInfo().then((user) => {
      this.userInfo = user;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  logout() {
    this.oktaSvc.signOut();
  }

}
