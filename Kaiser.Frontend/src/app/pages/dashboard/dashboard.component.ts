import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
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
          <div class="stat-lbl">مجموع درآمد تایید شده</div>
          <div class="stat-val">{{ stats.totalRevenue || 0 | number }} <span style="font-size: 12px; color: #94a3b8;">تومان</span></div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid" style="margin-top: 24px;">
      <div class="k-card">
        <div class="k-card-header">
          <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-chart-line" style="color: #6366f1;"></i> نمودار فروش واقعی ۷ روز اخیر
          </span>
          <span class="badge badge-info">{{ stats.totalOrders || 0 }} سفارش ثبت شده</span>
        </div>
        <div style="height: 260px; position: relative;">
          <canvas #salesCanvas></canvas>
        </div>
      </div>

      <div class="k-card">
        <div class="k-card-header">
          <span style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-chart-pie" style="color: #06b6d4;"></i> توزیع ترافیک واقعی سرورها
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
          <i class="fa-solid fa-list-check" style="color: #10b981;"></i> آخرین اشتراک‌های صادر شده واقعی
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
                / {{ item.totalLimit > 0 ? (item.totalLimit / 1073741824).toFixed(0) + ' GB' : 'نامحدود' }}
              </td>
              <td>
                <span class="badge" [ngClass]="item.state === 1 ? 'badge-success' : 'badge-danger'">
                  {{ item.state === 1 ? 'فعال' : 'منقضی' }}
                </span>
              </td>
              <td><code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">{{ item.token }}</code></td>
            </tr>
            <tr *ngIf="!stats.recentServices || stats.recentServices.length === 0">
              <td colspan="6" style="text-align: center; padding: 28px; color: var(--text-muted);">
                <i class="fa-solid fa-inbox" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                هنوز هیچ اشتراکی صادر نشده است.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trafficCanvas') trafficCanvas!: ElementRef<HTMLCanvasElement>;

  stats: any = {
    totalUsers: 0,
    activeServices: 0,
    totalServers: 0,
    onlineServers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    recentServices: [],
    salesChart: [],
    trafficChart: []
  };

  private salesChartInstance: Chart | null = null;
  private trafficChartInstance: Chart | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    if (this.stats.salesChart?.length) {
      this.renderCharts();
    }
  }

  ngOnDestroy() {
    if (this.salesChartInstance) this.salesChartInstance.destroy();
    if (this.trafficChartInstance) this.trafficChartInstance.destroy();
  }

  loadStats() {
    this.api.getDashboard().subscribe({
      next: (res) => {
        this.stats = res;
        setTimeout(() => this.renderCharts(), 50);
      },
      error: (err) => console.error('Dashboard load error:', err)
    });
  }

  renderCharts() {
    if (!this.salesCanvas?.nativeElement || !this.trafficCanvas?.nativeElement) return;

    // 1. Render Sales Line Chart with REAL DB Data
    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }

    const salesLabels = this.stats.salesChart?.length
      ? this.stats.salesChart.map((s: any) => s.date)
      : ['روز ۱', 'روز ۲', 'روز ۳', 'روز ۴', 'روز ۵', 'روز ۶', 'امروز'];

    const salesValues = this.stats.salesChart?.length
      ? this.stats.salesChart.map((s: any) => s.amount)
      : [0, 0, 0, 0, 0, 0, 0];

    this.salesChartInstance = new Chart(this.salesCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: salesLabels,
        datasets: [{
          label: 'فروش روزانه (تومان)',
          data: salesValues,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#6366f1',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true,
            callbacks: {
              label: (context) => ` فروش: ${(context.raw as number || 0).toLocaleString('fa-IR')} تومان`
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Vazirmatn' } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Vazirmatn' } } }
        }
      }
    });

    // 2. Render Traffic Doughnut Chart with REAL Server Data
    if (this.trafficChartInstance) {
      this.trafficChartInstance.destroy();
    }

    const trafficLabels: string[] = [];
    const trafficValues: number[] = [];
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    if (this.stats.trafficChart && this.stats.trafficChart.length > 0) {
      this.stats.trafficChart.forEach((t: any) => {
        trafficLabels.push(t.serverName);
        trafficValues.push(t.trafficBytes > 0 ? t.trafficBytes : 1);
      });
    } else {
      trafficLabels.push('بدون سرور فعال');
      trafficValues.push(1);
    }

    this.trafficChartInstance = new Chart(this.trafficCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: trafficLabels,
        datasets: [{
          data: trafficValues,
          backgroundColor: colors.slice(0, trafficLabels.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Vazirmatn', size: 11 } }
          },
          tooltip: {
            rtl: true,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.raw as number;
                const gb = (val / 1073741824).toFixed(2);
                return ` ${label}: ${gb} GB`;
              }
            }
          }
        },
        cutout: '72%'
      }
    });
  }
}
