import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: #6366f1;">
          <i class="fa-solid fa-users"></i>
        </div>
        <div>
          <div class="stat-lbl">کل کاربران ربات</div>
          <div class="stat-val">{{ stats.totalUsers || 0 | number }} <span style="font-size: 12px; color: #10b981;">نفر</span></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <div>
          <div class="stat-lbl">اشتراک‌های فعال</div>
          <div class="stat-val">{{ stats.activeServices || 0 | number }} <span style="font-size: 12px; color: #06b6d4;">سرویس</span></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
          <i class="fa-solid fa-server"></i>
        </div>
        <div>
          <div class="stat-lbl">نودهای سرور آنلاین</div>
          <div class="stat-val">{{ stats.onlineServers || 0 }} / {{ stats.totalServers || 0 }} <span style="font-size: 12px; color: #10b981;">آنلاین</span></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
          <i class="fa-solid fa-sack-dollar"></i>
        </div>
        <div>
          <div class="stat-lbl">مجموع درآمد حاصله</div>
          <div class="stat-val">{{ stats.totalRevenue || 0 | number }} <span style="font-size: 12px; color: #94a3b8;">تومان</span></div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 24px;">
      <div class="k-card">
        <div class="k-card-header">
          <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-chart-line" style="color: #6366f1;"></i> نمودار فروش و درآمد هفتگی
          </span>
        </div>
        <div style="height: 260px; position: relative;">
          <canvas #salesCanvas></canvas>
        </div>
      </div>

      <div class="k-card">
        <div class="k-card-header">
          <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-chart-pie" style="color: #06b6d4;"></i> توزیع ترافیک سرورها
          </span>
        </div>
        <div style="height: 260px; position: relative;">
          <canvas #trafficCanvas></canvas>
        </div>
      </div>
    </div>

    <!-- Recent Services -->
    <div class="k-card" style="margin-top: 24px;">
      <div class="k-card-header">
        <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-list-check" style="color: #10b981;"></i> آخرین اشتراک‌های صادر شده
        </span>
      </div>
      <div class="table-container">
        <table class="k-table">
          <thead>
            <tr>
              <th>شناسه</th>
              <th>کاربر (Email)</th>
              <th>پلن اشتراک</th>
              <th>ترافیک مصرفی</th>
              <th>وضعیت</th>
              <th>توکن ساب</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of stats.recentServices">
              <td>#{{ item.id }}</td>
              <td><strong>{{ item.email }}</strong></td>
              <td>{{ item.planName }}</td>
              <td>
                <span style="color: #6366f1;">{{ (item.totalUsed / 1073741824).toFixed(1) }} GB</span>
                / {{ (item.totalLimit / 1073741824).toFixed(0) }} GB
              </td>
              <td>
                <span class="badge" [ngClass]="item.state === 1 ? 'badge-success' : 'badge-danger'">
                  {{ item.state === 1 ? 'فعال' : 'منقضی' }}
                </span>
              </td>
              <td><code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">{{ item.token }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trafficCanvas') trafficCanvas!: ElementRef<HTMLCanvasElement>;

  stats: any = {
    totalUsers: 0,
    activeServices: 0,
    totalServers: 0,
    onlineServers: 0,
    totalRevenue: 0,
    recentServices: []
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    this.renderCharts();
  }

  loadStats() {
    this.api.getDashboard().subscribe({
      next: (res) => {
        this.stats = res;
        this.renderCharts();
      },
      error: (err) => console.error(err)
    });
  }

  renderCharts() {
    if (!this.salesCanvas || !this.trafficCanvas) return;

    // Sales Chart
    new Chart(this.salesCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
        datasets: [{
          label: 'فروش روزانه (تومان)',
          data: [120000, 240000, 190000, 350000, 280000, 420000, 560000],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });

    // Traffic Chart
    new Chart(this.trafficCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['آلمان (Hetzner)', 'فنلاند (Gaming)', 'هلند (Trade)', 'فرانسه (OVH)'],
        datasets: [{
          data: [55, 20, 15, 10],
          backgroundColor: ['#6366f1', '#06b6d4', '#f59e0b', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8' }
          }
        },
        cutout: '70%'
      }
    });
  }
}
