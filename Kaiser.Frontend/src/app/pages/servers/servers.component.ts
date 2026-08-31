import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-servers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="k-card">
      <div class="k-card-header">
        <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-server" style="color: #6366f1;"></i> مدیریت نودهای سرور و پنل‌های X-UI
        </span>
        <button class="k-btn k-btn-primary" (click)="openModal()">
          <i class="fa-solid fa-plus"></i> افزودن سرور جدید
        </button>
      </div>

      <div class="table-container">
        <table class="k-table">
          <thead>
            <tr>
              <th>شناسه</th>
              <th>نام سرور</th>
              <th>نوع پنل</th>
              <th>آدرس پنل</th>
              <th>دامنه اتصال</th>
              <th>اینباند ID</th>
              <th>وضعیت اتصال</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of servers">
              <td>#{{ s.id }}</td>
              <td><strong>{{ s.name }}</strong></td>
              <td><span class="badge badge-info">{{ s.panelType }}</span></td>
              <td><code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">{{ s.url }}</code></td>
              <td>{{ s.domain }}</td>
              <td>{{ s.inboundId }}</td>
              <td>
                <span class="badge" [ngClass]="s.connection === 1 ? 'badge-success' : 'badge-danger'">
                  <i class="fa-solid" [ngClass]="s.connection === 1 ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
                  {{ s.connection === 1 ? 'آنلاین' : 'قطع ارتباط' }}
                </span>
              </td>
              <td>
                <button class="k-btn k-btn-outline" style="padding: 4px 10px; font-size: 11px; margin-left: 6px;" (click)="ping(s)">
                  <i class="fa-solid fa-bolt"></i> تست پینگ
                </button>
                <button class="k-btn k-btn-danger" style="padding: 4px 10px; font-size: 11px;" (click)="deleteServer(s.id)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 style="font-size: 16px;">افزودن نود سرور جدید</h3>
          <i class="fa-solid fa-xmark" style="cursor: pointer;" (click)="closeModal()"></i>
        </div>
        <form (ngSubmit)="saveServer()">
          <div class="form-group">
            <label>نام سرور:</label>
            <input type="text" class="form-control" [(ngModel)]="newServer.name" name="name" required placeholder="مثال: Frankfurt VIP-01">
          </div>
          <div class="form-group">
            <label>آدرس URL پنل:</label>
            <input type="text" class="form-control" [(ngModel)]="newServer.url" name="url" required placeholder="https://panel.example.com:2053">
          </div>
          <div class="form-group">
            <label>نام کاربری پنل:</label>
            <input type="text" class="form-control" [(ngModel)]="newServer.user" name="user" required>
          </div>
          <div class="form-group">
            <label>کلمه عبور پنل:</label>
            <input type="password" class="form-control" [(ngModel)]="newServer.password" name="password" required>
          </div>
          <div class="form-group">
            <label>دامنه اتصال کلاینت (SNI / Host):</label>
            <input type="text" class="form-control" [(ngModel)]="newServer.domain" name="domain" placeholder="de1.kaiser-cdn.com">
          </div>
          <div class="form-group">
            <label>اینباند ID:</label>
            <input type="number" class="form-control" [(ngModel)]="newServer.inboundId" name="inboundId" value="1">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" class="k-btn k-btn-outline" (click)="closeModal()">انصراف</button>
            <button type="submit" class="k-btn k-btn-primary">ذخیره سرور</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ServersComponent implements OnInit {
  servers: any[] = [];
  showModal = false;
  newServer: any = { name: '', url: '', user: 'admin', password: '', domain: '', inboundId: 1, panelType: 'sanaei', catId: 1 };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadServers();
  }

  loadServers() {
    this.api.getServers().subscribe({
      next: (res) => this.servers = res,
      error: (err) => console.error(err)
    });
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; }

  saveServer() {
    this.api.createServer(this.newServer).subscribe({
      next: () => {
        this.closeModal();
        this.loadServers();
      }
    });
  }

  deleteServer(id: number) {
    if (confirm('آیا از حذف این سرور اطمینان دارید؟')) {
      this.api.deleteServer(id).subscribe({
        next: () => this.loadServers()
      });
    }
  }

  ping(s: any) {
    alert(`در حال تست پینگ با سرور ${s.name}...`);
    this.api.pingServer(s.id).subscribe({
      next: (res) => {
        alert(res.success ? `✅ ارتباط موفق! پینگ: ${res.pingMs}ms (اینباندها: ${res.inboundsCount})` : `❌ خطا: ${res.message}`);
      }
    });
  }
}
