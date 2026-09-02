import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'Namahdood Net Panel';
  loginUsername = 'roham';
  loginPassword = '';
  loginError = '';
  rememberMe = true;
  showLoginModal = false;
  mobileSidebarOpen = false;

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.loginUsername = this.auth.getSavedUsername();

    if (!this.auth.isLoggedIn()) {
      this.showLoginModal = true;
    }

    // Auto close mobile drawer on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.mobileSidebarOpen = false;
    });
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen = false;
  }

  submitLogin() {
    this.loginError = '';
    this.auth.login({
      username: this.loginUsername,
      password: this.loginPassword,
      rememberMe: this.rememberMe
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showLoginModal = false;
          this.loginPassword = '';
        } else {
          this.loginError = res.message || 'خطا در ورود';
        }
      },
      error: (err) => {
        this.loginError = err.error?.message || 'نام کاربری یا رمز عبور اشتباه است.';
      }
    });
  }

  logout() {
    this.auth.logout();
    this.loginUsername = this.auth.getSavedUsername();
    this.loginPassword = '';
    this.showLoginModal = true;
    this.mobileSidebarOpen = false;
  }
}
