import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'Kaiser Management Panel';
  loginUsername = 'admin';
  loginPassword = '';
  loginError = '';
  showLoginModal = false;

  constructor(public auth: AuthService) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.showLoginModal = true;
    }
  }

  submitLogin() {
    this.loginError = '';
    this.auth.login({ username: this.loginUsername, password: this.loginPassword }).subscribe({
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
    this.showLoginModal = true;
  }
}
