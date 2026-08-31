import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="k-card">
      <div class="k-card-header">
        <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-gears" style="color: #6366f1;"></i> تنظیمات عمومی ربات، اعلان‌ها و پرداخت‌ها
        </span>
        <button class="k-btn k-btn-primary" (click)="saveSettings()">
          <i class="fa-solid fa-save"></i> ذخیره تغییرات
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <!-- Admin Telegram Numeric ID -->
          <div class="form-group" style="background: rgba(99, 102, 241, 0.1); padding: 14px; border-radius: 10px; border: 1px solid rgba(99, 102, 241, 0.3);">
            <label style="color: #a5b4fc; font-weight: 700;">
              <i class="fa-brands fa-telegram"></i> شناسه عددی تلگرام ادمین (دریافت گزارش ورود و اعلان‌ها):
            </label>
            <input type="text" class="form-control" [(ngModel)]="settings.adminTelegramId" name="adminTelegramId" placeholder="مثال: 123456789">
            <small style="color: var(--text-muted); font-size: 11px; margin-top: 4px; display: block;">
              وقتی کاربری ربات را استارت می‌زند یا سفارشی ثبت می‌شود، گزارش لحظه‌ای با تعداد کل کاربران و مشخصات فرد به این آیدی عددی ارسال می‌شود.
            </small>
          </div>

          <div class="form-group" style="margin-top: 14px;">
            <label>شماره کارت ادمین (کارت به کارت):</label>
            <input type="text" class="form-control" [(ngModel)]="settings.cardAdminNumber" name="cardAdminNumber" placeholder="6037-xxxx-xxxx-xxxx">
          </div>

          <div class="form-group">
            <label>نام صاحب حساب کارت:</label>
            <input type="text" class="form-control" [(ngModel)]="settings.cardAdminName" name="cardAdminName" placeholder="نام و نام خانوادگی">
          </div>

          <div class="form-group">
            <label>دامنه سابسکریپشن (SubDomain):</label>
            <input type="text" class="form-control" [(ngModel)]="settings.subDomain" name="subDomain" placeholder="sub.yourdomain.com">
          </div>

          <div class="form-group">
            <label>آیدی کانال جوین اجباری (بدون &#64;):</label>
            <input type="text" class="form-control" [(ngModel)]="settings.lockChanel" name="lockChanel" placeholder="channel_username">
          </div>
        </div>

        <div>
          <div class="form-group">
            <label>درگاه پرداخت آنلاین:</label>
            <select class="form-control" [(ngModel)]="settings.paymentGateway" name="paymentGateway">
              <option value="zibal">زیبال (Zibal)</option>
              <option value="madpal">مدپال (Madpal)</option>
              <option value="nextpay">نکست‌پی (NextPay)</option>
            </select>
          </div>

          <div class="form-group">
            <label>پاداش دعوت دوستان (درصد یا ضریب):</label>
            <input type="number" class="form-control" [(ngModel)]="settings.rewardInvite" name="rewardInvite">
          </div>

          <div class="form-group">
            <label>آیدی پشتیبانی در ربات (بدون &#64;):</label>
            <input type="text" class="form-control" [(ngModel)]="settings.suppourtId" name="suppourtId" placeholder="support_username">
          </div>

          <div class="form-group">
            <label>متن راهنمای کارت به کارت:</label>
            <textarea class="form-control" rows="3" [(ngModel)]="settings.alertCard" name="alertCard" placeholder="متن راهنمای پرداخت کارت به کارت"></textarea>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  settings: any = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.api.getSettings().subscribe({
      next: (res) => this.settings = res,
      error: (err) => console.error(err)
    });
  }

  saveSettings() {
    this.api.updateSettings(this.settings).subscribe({
      next: () => alert('✅ تنظیمات با موفقیت ذخیره شد.'),
      error: () => alert('❌ خطا در ذخیره تنظیمات.')
    });
  }
}
