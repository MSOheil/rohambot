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
              <i class="fa-brands fa-telegram"></i> شناسه‌های عددی تلگرام ادمین‌ها (دریافت گزارش ورود و اعلان‌ها):
            </label>
            <input type="text" class="form-control" [(ngModel)]="settings.adminTelegramId" name="adminTelegramId" placeholder="8793231252, 8429466517">
            <small style="color: var(--text-muted); font-size: 11px; margin-top: 4px; display: block;">
              می‌توانید چند شناسه عددی را با کاما (,) یا فاصله وارد کنید تا گزارش ورود کاربران و سفارش‌ها برای همه ادمین‌ها ارسال شود.
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

      <!-- Night Message Scheduled Broadcast Section -->
      <div style="margin-top: 24px; padding: 18px; border-radius: 12px; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-weight: 700; color: #a5b4fc; font-size: 15px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-moon" style="color: #fbbf24;"></i> پیام شب‌بخیر خودکار به کاربران (ساعت به وقت رسمی ایران)
          </span>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
            <input type="checkbox" [checked]="settings.nightMessageEnabled === 1" (change)="toggleNightMessage($event)" style="accent-color: var(--primary); width: 16px; height: 16px;">
            <span [style.color]="settings.nightMessageEnabled === 1 ? '#10b981' : 'var(--text-muted)'">
              {{ settings.nightMessageEnabled === 1 ? 'فعال' : 'غیرفعال' }}
            </span>
          </label>
        </div>

        <div style="display: grid; grid-template-columns: 240px 1fr; gap: 20px;">
          <div class="form-group">
            <label>ساعت ارسال (طبق ساعت رسمی ایران):</label>
            <input type="time" class="form-control" [(ngModel)]="settings.nightMessageTime" name="nightMessageTime">
            <small style="color: var(--text-muted); font-size: 11px; margin-top: 4px; display: block;">
              به صورت پیش‌فرض: 23:00 (۱۱ شب به وقت تهران)
            </small>
          </div>

          <div class="form-group">
            <label>متن پیام شب‌بخیر:</label>
            <textarea class="form-control" rows="4" [(ngModel)]="settings.nightMessageText" name="nightMessageText" placeholder="متن پیام شب‌بخیر برای ارسال به کاربران..."></textarea>
            <small style="color: var(--text-muted); font-size: 11px; margin-top: 4px; display: block;">
              این پیام رأس ساعت تنظیم‌شده هر شب یک‌بار برای کلیه کاربران ربات ارسال می‌گردد.
            </small>
          </div>
        </div>
      </div>

      <!-- Welcome Message Customization Section -->
      <div style="margin-top: 24px; padding: 18px; border-radius: 12px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-weight: 700; color: #38bdf8; font-size: 15px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-hand-peace" style="color: #38bdf8;"></i> متن پیام خوش‌آمدگویی ربات (Welcome Message)
          </span>
          <button type="button" class="k-btn k-btn-outline" style="padding: 4px 10px; font-size: 11px;" (click)="resetWelcomeMessage()">
            <i class="fa-solid fa-rotate-left"></i> بازنشانی به پیش‌فرض
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; align-items: start;">
          <div class="form-group">
            <label>متن پیام استارت و خوش‌آمدگویی به کاربر:</label>
            <textarea class="form-control" rows="8" [(ngModel)]="settings.welcomeMessage" name="welcomeMessage"
                      placeholder="متن پیام ورود و استارت ربات..."
                      style="line-height: 1.6; font-size: 13px;"></textarea>
            <small style="color: var(--text-muted); font-size: 11px; margin-top: 6px; display: block;">
              💡 این متن هنگام ارسال دستور /start توسط کاربر مستقیماً از دیتابیس خوانده شده و ارسال می‌گردد.
            </small>
          </div>

          <!-- Telegram Bubble Live Preview -->
          <div>
            <label style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; display: block;">
              پیش‌نمایش در تلگرام:
            </label>
            <div style="background: #17212b; border: 1px solid #242f3d; border-radius: 12px; padding: 14px; color: #fff; font-size: 12.5px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; max-height: 220px; overflow-y: auto;">
              {{ settings.welcomeMessage || defaultWelcomeText }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  settings: any = {};
  defaultWelcomeText = `به ربات   «نامحدود نت»   خوش آمدید.


⚡️ارائه پر سرعت و نامحدود اشتراک های V2ray برای استفاده 
شخصی و مولتی لوکیشن open vpn 
🇩🇪🇳🇱🇯🇴🇹🇷
مخصوص گیم، ترید ،فیلم سرعت 🛜بسیار بالاتر و پینگ پایین.
⏱️تحویل آنی و قابلیت مدیریت هوشمند سابسکریبشن

لطفا از منوی زیر  گزینه مورد نظر خود را انتخاب کنید👇👇👇`;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.api.getSettings().subscribe({
      next: (res) => {
        this.settings = res;
        if (!this.settings.nightMessageTime) this.settings.nightMessageTime = '23:00';
        if (this.settings.nightMessageEnabled === undefined) this.settings.nightMessageEnabled = 1;
        if (!this.settings.welcomeMessage) this.settings.welcomeMessage = this.defaultWelcomeText;
      },
      error: (err) => console.error(err)
    });
  }

  resetWelcomeMessage() {
    this.settings.welcomeMessage = this.defaultWelcomeText;
  }

  toggleNightMessage(event: any) {
    this.settings.nightMessageEnabled = event.target.checked ? 1 : 0;
  }

  saveSettings() {
    this.api.updateSettings(this.settings).subscribe({
      next: () => alert('✅ تنظیمات با موفقیت ذخیره شد.'),
      error: () => alert('❌ خطا در ذخیره تنظیمات.')
    });
  }
}
