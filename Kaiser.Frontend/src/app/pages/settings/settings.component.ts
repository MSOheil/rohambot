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
          <i class="fa-solid fa-gears" style="color: #6366f1;"></i> تنظیمات عمومی ربات و پرداخت‌ها
        </span>
        <button class="k-btn k-btn-primary" (click)="saveSettings()">
          <i class="fa-solid fa-save"></i> ذخیره تغییرات
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <div class="form-group">
            <label>شماره کارت ادمین (کارت به کارت):</label>
            <input type="text" class="form-control" [(ngModel)]="settings.cardAdminNumber" name="cardAdminNumber">
          </div>

          <div class="form-group">
            <label>نام صاحب حساب کارت:</label>
            <input type="text" class="form-control" [(ngModel)]="settings.cardAdminName" name="cardAdminName">
          </div>

          <div class="form-group">
            <label>دامنه سابسکریپشن (SubDomain):</label>
            <input type="text" class="form-control" [(ngModel)]="settings.subDomain" name="subDomain">
          </div>

          <div class="form-group">
            <label>آیدی کانال جوین اجباری (بدون &#64;):</label>
            <input type="text" class="form-control" [(ngModel)]="settings.lockChanel" name="lockChanel">
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
            <label>متن راهنمای کارت به کارت:</label>
            <textarea class="form-control" rows="3" [(ngModel)]="settings.alertCard" name="alertCard"></textarea>
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
