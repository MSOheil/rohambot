import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="k-card">
      <div class="k-card-header">
        <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-tags" style="color: #6366f1;"></i> تعرفه‌ها و پلن‌های فروش
        </span>
        <button class="k-btn k-btn-primary" (click)="openModal()">
          <i class="fa-solid fa-plus"></i> ایجاد پلن جدید
        </button>
      </div>

      <div class="table-container">
        <table class="k-table">
          <thead>
            <tr>
              <th>شناسه</th>
              <th>نام پلن</th>
              <th>توضیحات</th>
              <th>مدت اعتبار</th>
              <th>حجم (GB)</th>
              <th>قیمت (تومان)</th>
              <th>محدودیت کاربر</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of plans">
              <td>#{{ p.id }}</td>
              <td><strong>{{ p.planName }}</strong></td>
              <td style="color: var(--text-muted); font-size: 12px;">{{ p.description }}</td>
              <td>{{ p.monthCount }} ماهه</td>
              <td><span class="badge badge-info">{{ (p.volume / 1073741824).toFixed(0) }} GB</span></td>
              <td><strong style="color: #10b981;">{{ p.price | number }}</strong></td>
              <td>{{ p.userLimit }} کاربر</td>
              <td>
                <button class="k-btn k-btn-danger" style="padding: 4px 10px; font-size: 11px;" (click)="deletePlan(p.id)">
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
          <h3 style="font-size: 16px;">ایجاد پلن فروش جدید</h3>
          <i class="fa-solid fa-xmark" style="cursor: pointer;" (click)="closeModal()"></i>
        </div>
        <form (ngSubmit)="savePlan()">
          <div class="form-group">
            <label>نام پلن:</label>
            <input type="text" class="form-control" [(ngModel)]="newPlan.planName" name="planName" required placeholder="مثال: ۱ ماهه - ۵۰ گیگابایت VIP">
          </div>
          <div class="form-group">
            <label>توضیحات پلن:</label>
            <input type="text" class="form-control" [(ngModel)]="newPlan.description" name="description" placeholder="مناسب ۲ کاربر، پرسرعت">
          </div>
          <div class="form-group">
            <label>مدت زمان (ماه):</label>
            <input type="number" class="form-control" [(ngModel)]="newPlan.monthCount" name="monthCount" min="1" value="1">
          </div>
          <div class="form-group">
            <label>حجم ترافیک (گیگابایت):</label>
            <input type="number" class="form-control" [(ngModel)]="newPlan.volumeGB" name="volumeGB" min="1" placeholder="50">
          </div>
          <div class="form-group">
            <label>قیمت (تومان):</label>
            <input type="number" class="form-control" [(ngModel)]="newPlan.price" name="price" placeholder="150000">
          </div>
          <div class="form-group">
            <label>محدودیت کاربر همزمان:</label>
            <input type="number" class="form-control" [(ngModel)]="newPlan.userLimit" name="userLimit" value="2">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" class="k-btn k-btn-outline" (click)="closeModal()">انصراف</button>
            <button type="submit" class="k-btn k-btn-primary">ذخیره پلن</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PlansComponent implements OnInit {
  plans: any[] = [];
  showModal = false;
  newPlan: any = { planName: '', description: '', monthCount: 1, volumeGB: 30, price: 120000, userLimit: 2, catId: 1 };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.api.getPlans().subscribe({
      next: (res) => this.plans = res,
      error: (err) => console.error(err)
    });
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; }

  savePlan() {
    this.api.createPlan(this.newPlan).subscribe({
      next: () => {
        this.closeModal();
        this.loadPlans();
      }
    });
  }

  deletePlan(id: number) {
    if (confirm('آیا از حذف این پلن اطمینان دارید؟')) {
      this.api.deletePlan(id).subscribe({
        next: () => this.loadPlans()
      });
    }
  }
}
