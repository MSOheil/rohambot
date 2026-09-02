import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-sub-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 520px; margin: 0 auto;">
      <!-- Search by Token Form -->
      <div class="k-card" style="margin-bottom: 20px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-weight: 600; color: #fff; margin-bottom: 8px; display: block;">جستجوی وضعیت سابسکریپشن با توکن:</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" class="form-control" [(ngModel)]="searchToken" placeholder="توکن سابسکریپشن را وارد کنید..." style="flex: 1;">
            <button class="k-btn k-btn-primary" (click)="loadRealSubData(searchToken)">
              <i class="fa-solid fa-search"></i> استعلام
            </button>
          </div>
        </div>
      </div>

      <!-- Real Subscription Card -->
      <div class="k-card" style="text-align: center; border: 1px solid rgba(99, 102, 241, 0.3); box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);" *ngIf="subData">
        <img src="assets/logo.png" style="width: 64px; height: 64px; border-radius: 16px; margin-bottom: 12px; box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);" alt="Logo">
        <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 4px;">{{ subData.email || 'Namahdoodnet Subscription' }}</h2>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 20px;">
          وضعیت: 
          <span class="badge" [ngClass]="subData.state === 1 ? 'badge-success' : 'badge-danger'">
            {{ subData.state === 1 ? 'فعال و متصل' : 'منقضی شده' }}
          </span>
        </p>

        <div style="background: rgba(15, 23, 42, 0.6); padding: 18px; border-radius: 14px; border: 1px solid var(--border-color); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 8px;">
            <span style="color: var(--text-muted);">حجم مصرف شده:</span>
            <strong>
              {{ ((subData.upload + subData.download) / 1073741824).toFixed(2) }} GB 
              / {{ subData.totalUsed > 0 ? (subData.totalUsed / 1073741824).toFixed(0) + ' GB' : 'نامحدود' }}
            </strong>
          </div>

          <div style="background: rgba(255,255,255,0.08); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
            <div style="background: linear-gradient(90deg, #6366f1, #06b6d4); height: 100%; border-radius: 4px;" [style.width.%]="calcUsedPercent()"></div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
            <span>درصد مصرف: {{ calcUsedPercent().toFixed(1) }}%</span>
            <span>زمان باقی‌مانده: {{ calcRemainingDays() }} روز</span>
          </div>
        </div>

        <div style="margin: 20px 0;" *ngIf="qrUrl">
          <img [src]="qrUrl" alt="QR Code" style="border-radius: 12px; border: 4px solid #fff; max-width: 200px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
        </div>

        <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; font-family: monospace; font-size: 11.5px; word-break: break-all; margin-bottom: 16px;">
          {{ currentSubUrl }}
        </div>

        <button class="k-btn k-btn-primary" style="width: 100%; justify-content: center;" (click)="copyLink()">
          <i class="fa-solid fa-copy"></i> کپی کردن لینک سابسکریپشن
        </button>
      </div>

      <div class="k-card" style="text-align: center; color: var(--text-muted); padding: 32px;" *ngIf="!subData && !loading">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 28px; margin-bottom: 10px; display: block; color: var(--warning);"></i>
        هنوز هیچ توکنی انتخاب نشده یا اشتراکی یافت نشد. لطفاً از بخش «اشتراک‌های کاربران» روی دکمه ساب کلیک کرده یا یک توکن را در کادر بالا وارد کنید.
      </div>
    </div>
  `
})
export class SubPreviewComponent implements OnInit {
  searchToken = '';
  subData: any = null;
  loading = false;
  qrUrl = '';
  currentSubUrl = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.searchToken = token;
        this.loadRealSubData(token);
      } else {
        // Automatically fetch the first available service as default
        this.api.getServices().subscribe({
          next: (services) => {
            if (services && services.length > 0) {
              const firstToken = services[0].token;
              this.searchToken = firstToken;
              this.loadRealSubData(firstToken);
            }
          }
        });
      }
    });
  }

  loadRealSubData(token: string) {
    if (!token) return;
    this.loading = true;
    this.api.getSubscriptionState(token).subscribe({
      next: async (res) => {
        this.subData = res;
        this.loading = false;
        this.currentSubUrl = `${window.location.origin}/kaiser?token=${token}`;
        this.qrUrl = await (QRCode as any).toDataURL(this.currentSubUrl, { width: 300, margin: 2 });
      },
      error: () => {
        this.subData = null;
        this.loading = false;
      }
    });
  }

  calcUsedPercent(): number {
    if (!this.subData || !this.subData.totalUsed || this.subData.totalUsed === 0) return 0;
    const used = (this.subData.upload || 0) + (this.subData.download || 0);
    return Math.min(100, (used / this.subData.totalUsed) * 100);
  }

  calcRemainingDays(): number {
    if (!this.subData || !this.subData.endDate) return 0;
    const now = Math.floor(Date.now() / 1000);
    return this.subData.endDate > now ? Math.ceil((this.subData.endDate - now) / 86400) : 0;
  }

  copyLink() {
    if (!this.currentSubUrl) return;
    navigator.clipboard.writeText(this.currentSubUrl);
    alert('✅ لینک سابسکریپشن کپی شد!');
  }
}
