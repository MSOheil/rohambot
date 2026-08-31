import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="k-card">
      <div class="k-card-header">
        <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-receipt" style="color: #6366f1;"></i> سفارشات و تراکنش‌های مالی
        </span>
      </div>

      <div class="table-container">
        <table class="k-table">
          <thead>
            <tr>
              <th>شناسه سفارش</th>
              <th>شناسه کاربر</th>
              <th>نوع سفارش</th>
              <th>مبلغ فاکتور</th>
              <th>مبلغ پس از تخفیف</th>
              <th>وضعیت پرداخت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td>#{{ o.id }}</td>
              <td><code>{{ o.userId }}</code></td>
              <td><span class="badge badge-info">{{ o.type }}</span></td>
              <td>{{ o.price | number }} تومان</td>
              <td><strong style="color: #10b981;">{{ (o.priceAfterDiscount > 0 ? o.priceAfterDiscount : o.price) | number }} تومان</strong></td>
              <td>
                <span class="badge" [ngClass]="o.state === 1 ? 'badge-success' : (o.state === 0 ? 'badge-warning' : 'badge-danger')">
                  {{ o.state === 1 ? 'پرداخت شده' : (o.state === 0 ? 'در انتظار تایید' : 'رد شده/لغو') }}
                </span>
              </td>
              <td>
                <button *ngIf="o.state === 0" class="k-btn k-btn-primary" style="padding: 4px 10px; font-size: 11px; margin-left: 6px;" (click)="approve(o.id)">
                  <i class="fa-solid fa-check"></i> تایید و صدور
                </button>
                <button *ngIf="o.state === 0" class="k-btn k-btn-danger" style="padding: 4px 10px; font-size: 11px;" (click)="reject(o.id)">
                  <i class="fa-solid fa-xmark"></i> رد فیش
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.api.getOrders().subscribe({
      next: (res) => this.orders = res,
      error: (err) => console.error(err)
    });
  }

  approve(id: number) {
    if (confirm(`آیا از تایید و صدور خودکار سرویس برای سفارش #${id} اطمینان دارید؟`)) {
      this.api.approveOrder(id).subscribe({
        next: () => {
          alert('سفارش تایید شد و اشتراک صادر گردید.');
          this.loadOrders();
        }
      });
    }
  }

  reject(id: number) {
    if (confirm(`آیا از رد سفارش #${id} اطمینان دارید؟`)) {
      this.api.rejectOrder(id).subscribe({
        next: () => this.loadOrders()
      });
    }
  }
}
