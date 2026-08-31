import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-sub-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 480px; margin: 0 auto;">
      <div class="k-card" style="text-align: center; border: 1px solid rgba(99, 102, 241, 0.3); box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);">
        <div style="font-size: 32px; margin-bottom: 8px;">👑</div>
        <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 4px;">Kaiser VIP Subscription</h2>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 24px;">جزئیات و وضعیت اشتراک هوشمند</p>

        <div style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
            <span style="color: var(--text-muted);">حجم مصرف شده:</span>
            <strong>{{ (subData.usedBytes / 1073741824).toFixed(1) }} GB / {{ (subData.totalBytes / 1073741824).toFixed(0) }} GB</strong>
          </div>
          <div style="background: rgba(255,255,255,0.08); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
            <div style="background: linear-gradient(90deg, #6366f1, #06b6d4); height: 100%; border-radius: 4px;" [style.width.%]="subData.usedPercent"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
            <span>درصد مصرف: {{ subData.usedPercent }}%</span>
            <span>زمان باقی‌مانده: {{ subData.daysRemaining }} روز</span>
          </div>
        </div>

        <div style="margin: 20px 0;">
          <img *ngIf="qrUrl" [src]="qrUrl" alt="QR Code" style="border-radius: 12px; border: 4px solid #fff; max-width: 180px;">
        </div>

        <button class="k-btn k-btn-primary" style="width: 100%; justify-content: center; margin-bottom: 10px;" (click)="copyLink()">
          <i class="fa-solid fa-copy"></i> کپی لینک سابسکریپشن
        </button>
      </div>
    </div>
  `
})
export class SubPreviewComponent implements OnInit {
  subData: any = {
    usedBytes: 14 * 1024 * 1024 * 1024,
    totalBytes: 50 * 1024 * 1024 * 1024,
    usedPercent: 28,
    daysRemaining: 24,
    subLink: 'https://sub.kaiser-cdn.com/kaiser?token=sample_demo_token'
  };
  qrUrl = '';

  ngOnInit() {
    this.generateQr();
  }

  async generateQr() {
    this.qrUrl = await (QRCode as any).toDataURL(this.subData.subLink, { width: 300, margin: 2 });
  }

  copyLink() {
    navigator.clipboard.writeText(this.subData.subLink);
    alert('لینک سابسکریپشن کپی شد!');
  }
}
