import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="k-card">
      <div class="k-card-header">
        <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-users" style="color: #6366f1;"></i> مدیریت کاربران و مشتریان
        </span>
      </div>

      <div class="table-container">
        <table class="k-table">
          <thead>
            <tr>
              <th>شناسه عددی (Telegram ID)</th>
              <th>نام کاربری</th>
              <th>نام</th>
              <th>موجودی کیف پول</th>
              <th>زیرمجموعه‌ها</th>
              <th>تست رایگان</th>
              <th>نقش</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td><code>{{ u.userId }}</code></td>
              <td>{{ u.userName ? '@' + u.userName : '---' }}</td>
              <td><strong>{{ u.name || '---' }}</strong></td>
              <td><strong style="color: #10b981;">{{ (u.wallet || 0) | number }} تومان</strong></td>
              <td>{{ u.invited || 0 }} نفر</td>
              <td>
                <span class="badge" [ngClass]="u.useFreeTrial === 1 ? 'badge-success' : 'badge-warning'">
                  {{ u.useFreeTrial === 1 ? 'استفاده شده' : 'استفاده نشده' }}
                </span>
              </td>
              <td>
                <span class="badge" [ngClass]="u.isAdmin === 1 ? 'badge-danger' : 'badge-info'">
                  {{ u.isAdmin === 1 ? 'مدیر کل' : 'کاربر عادی' }}
                </span>
              </td>
              <td>
                <button class="k-btn k-btn-outline" style="padding: 4px 10px; font-size: 11px;" (click)="openWalletModal(u)">
                  <i class="fa-solid fa-wallet"></i> شارژ کیف پول
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Wallet Modal -->
    <div class="modal-overlay" *ngIf="showWalletModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 style="font-size: 16px;">تغییر موجودی کیف پول کاربر {{ selectedUser?.userId }}</h3>
          <i class="fa-solid fa-xmark" style="cursor: pointer;" (click)="showWalletModal = false"></i>
        </div>
        <form (ngSubmit)="submitWallet()">
          <div class="form-group">
            <label>مبلغ شارژ (تومان - برای کسر عدد منفی وارد کنید):</label>
            <input type="number" class="form-control" [(ngModel)]="walletAmount" name="amount" required placeholder="مثال: 50000">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" class="k-btn k-btn-outline" (click)="showWalletModal = false">انصراف</button>
            <button type="submit" class="k-btn k-btn-primary">ثبت تغییر</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  showWalletModal = false;
  selectedUser: any = null;
  walletAmount = 50000;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.api.getUsers().subscribe({
      next: (res) => this.users = res,
      error: (err) => console.error(err)
    });
  }

  openWalletModal(u: any) {
    this.selectedUser = u;
    this.showWalletModal = true;
  }

  submitWallet() {
    if (!this.selectedUser) return;
    this.api.updateWallet(this.selectedUser.userId, this.walletAmount).subscribe({
      next: () => {
        this.showWalletModal = false;
        this.loadUsers();
      }
    });
  }
}
