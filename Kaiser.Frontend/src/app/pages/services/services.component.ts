import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="k-card">
      <div class="k-card-header">
        <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-shield-halved" style="color: #10b981;"></i> مدیریت سرویس‌ها و اشتراک‌های فعال
        </span>
      </div>

      <div class="table-container">
        <table class="k-table">
          <thead>
            <tr>
              <th>شناسه</th>
              <th>شناسه کاربر</th>
              <th>ایمیل (Email)</th>
              <th>نوع سرویس</th>
              <th>مصرف ترافیک</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of services">
              <td>#{{ s.id }}</td>
              <td><code>{{ s.userId }}</code></td>
              <td><strong>{{ s.email }}</strong></td>
              <td><span class="badge badge-info">{{ s.typeService }}</span></td>
              <td>
                <div style="font-size: 11.5px; margin-bottom: 4px;">
                  {{ ((s.upload + s.download) / 1073741824).toFixed(1) }} GB / {{ s.totalUsed > 0 ? (s.totalUsed / 1073741824).toFixed(0) + ' GB' : 'نامحدود' }}
                </div>
                <div style="background: rgba(255,255,255,0.08); height: 6px; border-radius: 3px; width: 120px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #6366f1, #06b6d4); height: 100%; border-radius: 3px;"
                       [style.width.%]="s.totalUsed > 0 ? ((s.upload + s.download) / s.totalUsed * 100) : 0"></div>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="s.state === 1 ? 'badge-success' : 'badge-danger'">
                  {{ s.state === 1 ? 'فعال' : 'غیرفعال' }}
                </span>
              </td>
              <td>
                <button class="k-btn k-btn-outline" style="padding: 4px 10px; font-size: 11px; margin-left: 6px;" (click)="showQr(s)">
                  <i class="fa-solid fa-qrcode"></i> QR و لینک
                </button>
                <button class="k-btn k-btn-outline" style="padding: 4px 10px; font-size: 11px; margin-left: 6px;" (click)="toggleState(s)">
                  <i class="fa-solid" [ngClass]="s.state === 1 ? 'fa-pause' : 'fa-play'"></i>
                </button>
                <button class="k-btn k-btn-danger" style="padding: 4px 10px; font-size: 11px;" (click)="deleteService(s.id)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- QR Modal -->
    <div class="modal-overlay" *ngIf="showQrModal">
      <div class="modal-content" style="text-align: center;">
        <div class="modal-header">
          <h3 style="font-size: 16px;">لینک و بارکد سابسکریپشن</h3>
          <i class="fa-solid fa-xmark" style="cursor: pointer;" (click)="showQrModal = false"></i>
        </div>
        <div style="margin: 20px 0;">
          <img [src]="qrDataUrl" alt="QR Code" style="border-radius: 12px; border: 4px solid #fff; max-width: 200px;">
        </div>
        <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; margin-bottom: 20px;">
          {{ currentSubUrl }}
        </div>
        <button class="k-btn k-btn-primary" style="width: 100%; justify-content: center;" (click)="copySubLink()">
          <i class="fa-solid fa-copy"></i> کپی کردن لینک سابسکریپشن
        </button>
      </div>
    </div>
  `
})
export class ServicesComponent implements OnInit {
  services: any[] = [];
  showQrModal = false;
  qrDataUrl = '';
  currentSubUrl = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.api.getServices().subscribe({
      next: (res) => this.services = res,
      error: (err) => console.error(err)
    });
  }

  toggleState(s: any) {
    this.api.toggleService(s.id).subscribe({
      next: () => this.loadServices()
    });
  }

  deleteService(id: number) {
    if (confirm('آیا از حذف این سرویس اطمینان دارید؟')) {
      this.api.deleteService(id).subscribe({
        next: () => this.loadServices()
      });
    }
  }

  async showQr(s: any) {
    this.currentSubUrl = `${window.location.origin}/kaiser?token=${s.token}`;
    this.qrDataUrl = await (QRCode as any).toDataURL(this.currentSubUrl, { width: 300, margin: 2 });
    this.showQrModal = true;
  }

  copySubLink() {
    navigator.clipboard.writeText(this.currentSubUrl);
    alert('لینک سابسکریپشن در کلیپ‌بورد کپی شد!');
  }
}
