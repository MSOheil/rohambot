import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="broadcast-container">
      <!-- Header -->
      <div class="k-card" style="margin-bottom: 20px;">
        <div class="k-card-header" style="margin-bottom: 0;">
          <div>
            <span style="font-weight: 800; font-size: 18px; display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-bullhorn" style="color: #6366f1;"></i> مرکز ارسال پیام و اطلاعیه به کاربران
            </span>
            <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 6px;">
              ارسال پیام اختصاصی یا همگانی به اعضای ربات تلگرام با رعایت محدودیت نرخ ارسال و پیش‌نمایش زنده
            </p>
          </div>
        </div>
      </div>

      <!-- Result Banner -->
      <div *ngIf="lastResult" style="padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;"
           [style.background]="lastResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'"
           [style.border]="lastResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'"
           [style.color]="lastResult.success ? '#10b981' : '#ef4444'">
        <div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px;">
          <i [class]="lastResult.success ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'"></i>
          <span>{{ lastResult.message }}</span>
        </div>
        <i class="fa-solid fa-xmark" style="cursor: pointer;" (click)="lastResult = null"></i>
      </div>

      <!-- Main 2-Column Layout -->
      <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; align-items: start;">
        
        <!-- Left Column: Settings & Composer -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Audience Target Mode -->
          <div class="k-card">
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-users-viewfinder" style="color: #38bdf8;"></i> انتخاب مخاطبان پیام
            </h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div (click)="sendToAll = true"
                   style="cursor: pointer; padding: 14px; border-radius: 10px; border: 2px solid; transition: all 0.2s;"
                   [style.border-color]="sendToAll ? 'var(--primary)' : 'var(--border-color)'"
                   [style.background]="sendToAll ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)'">
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-globe" style="color: #6366f1;"></i> ارسال همگانی
                </div>
                <div style="font-size: 11.5px; color: var(--text-muted);">
                  ارسال به کلیه کاربران سیستم ({{ users.length }} کاربر)
                </div>
              </div>

              <div (click)="sendToAll = false"
                   style="cursor: pointer; padding: 14px; border-radius: 10px; border: 2px solid; transition: all 0.2s;"
                   [style.border-color]="!sendToAll ? 'var(--primary)' : 'var(--border-color)'"
                   [style.background]="!sendToAll ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)'">
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-user-check" style="color: #38bdf8;"></i> انتخاب دستی کاربران
                </div>
                <div style="font-size: 11.5px; color: var(--text-muted);">
                  گزینش دستی کاربران دلخواه با چک‌باکس
                </div>
              </div>
            </div>

            <!-- Manual Selection Table -->
            <div *ngIf="!sendToAll" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px;">
                <input type="text" class="form-control" [(ngModel)]="searchQuery" placeholder="🔍 جستجو با شناسه، نام کاربری یا نام..." style="flex: 1; font-size: 12px;">
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="k-btn k-btn-outline" style="padding: 4px 10px; font-size: 11px;" (click)="selectAll()">
                    انتخاب همه
                  </button>
                  <button type="button" class="k-btn k-btn-outline" style="padding: 4px 10px; font-size: 11px;" (click)="deselectAll()">
                    لغو همه
                  </button>
                </div>
              </div>

              <div style="font-size: 12px; color: #38bdf8; margin-bottom: 8px; font-weight: 600;">
                کاربران انتخاب‌شده: {{ selectedUserIds.size }} از {{ users.length }} کاربر
              </div>

              <div style="max-height: 240px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
                <table class="k-table" style="font-size: 12px; margin: 0;">
                  <thead>
                    <tr>
                      <th style="width: 36px; text-align: center;">#</th>
                      <th>شناسه تلگرام</th>
                      <th>نام کاربری</th>
                      <th>نام کاربر</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let u of filteredUsers" (click)="toggleUser(u.userId)" style="cursor: pointer;">
                      <td style="text-align: center;" (click)="$event.stopPropagation()">
                        <input type="checkbox" [checked]="selectedUserIds.has(u.userId)" (change)="toggleUser(u.userId)" style="accent-color: var(--primary);">
                      </td>
                      <td><code>{{ u.userId }}</code></td>
                      <td>{{ u.userName ? '@' + u.userName : '—' }}</td>
                      <td>{{ u.name || 'بدون نام' }}</td>
                    </tr>
                    <tr *ngIf="filteredUsers.length === 0">
                      <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 14px;">کاربری یافت نشد</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Message Composer Card -->
          <div class="k-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 style="font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0;">
                <i class="fa-solid fa-pen-to-square" style="color: #a855f7;"></i> متن پیام
              </h3>
              <span style="font-size: 11px; color: var(--text-muted);">
                {{ messageText.length }} کاراکتر
              </span>
            </div>

            <!-- Toolbar (Emojis & Markdown shortcuts) -->
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 8px;">
              <span style="font-size: 11px; color: var(--text-muted); align-self: center; margin-left: 6px;">درج سریع:</span>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 7px; font-size: 12px;" (click)="insertText('📢 ')">📢</button>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 7px; font-size: 12px;" (click)="insertText('⚡️ ')">⚡️</button>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 7px; font-size: 12px;" (click)="insertText('🎁 ')">🎁</button>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 7px; font-size: 12px;" (click)="insertText('🚀 ')">🚀</button>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 7px; font-size: 12px;" (click)="insertText('⏳ ')">⏳</button>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 7px; font-size: 12px;" (click)="insertText('⚠️ ')">⚠️</button>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 7px; font-size: 12px;" (click)="insertText('🌙 ')">🌙</button>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 7px; font-size: 12px;" (click)="insertText('♾️ ')">♾️</button>
              <span style="border-right: 1px solid var(--border-color); margin: 0 4px;"></span>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 8px; font-size: 11px;" (click)="wrapText('**', '**')"><b>B</b> بولد</button>
              <button type="button" class="k-btn k-btn-outline" style="padding: 2px 8px; font-size: 11px;" (click)="wrapCode()"><code>کد</code></button>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <textarea class="form-control" rows="8" [(ngModel)]="messageText"
                        placeholder="متن پیام خود را اینجا بنویسید...&#10;می‌توانید از شکلک‌ها، خطوط جدید و قالب‌بندی‌های تلگرام استفاده نمایید."
                        style="line-height: 1.6; font-size: 13.5px;"></textarea>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" class="k-btn k-btn-outline" (click)="testSendToAdmin()" [disabled]="sending || !messageText.trim()">
                <i class="fa-solid fa-vial"></i> ارسال تستی به ادمین
              </button>
              <button type="button" class="k-btn k-btn-primary" (click)="confirmBroadcast()" [disabled]="sending || !messageText.trim() || (!sendToAll && selectedUserIds.size === 0)">
                <i class="fa-solid fa-paper-plane"></i>
                <span *ngIf="!sending">
                  {{ sendToAll ? 'ارسال به همه (' + users.length + ' کاربر)' : 'ارسال به ' + selectedUserIds.size + ' کاربر انتخابی' }}
                </span>
                <span *ngIf="sending">در حال ارسال...</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Live Telegram Preview -->
        <div class="k-card" style="position: sticky; top: 90px;">
          <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-brands fa-telegram" style="color: #229ed9;"></i> پیش‌نمایش زنده در تلگرام
          </h3>

          <!-- Telegram Bubble Card -->
          <div style="background: #17212b; border: 1px solid #242f3d; border-radius: 16px; padding: 18px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">
            
            <!-- Bot Header -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <img src="assets/logo.png" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);" alt="Bot">
              <div>
                <div style="font-weight: 700; font-size: 14px; color: #fff;">ربات نامحدود نت</div>
                <div style="font-size: 11px; color: #229ed9;">bot</div>
              </div>
            </div>

            <!-- Message Bubble -->
            <div style="background: #182533; border-radius: 12px 12px 2px 12px; padding: 14px 16px; border: 1px solid rgba(255,255,255,0.05); color: #fff; font-size: 13.5px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; min-height: 120px;">
              {{ messageText || 'پیش‌نمایش متن پیام شما در این قسمت به سبک تلگرام نمایش داده می‌شود...' }}
            </div>

            <!-- Bubble Footer / Time -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 4px; margin-top: 8px; font-size: 10.5px; color: #6c7883;">
              <span>{{ getCurrentTime() }}</span>
              <i class="fa-solid fa-check-double" style="color: #229ed9; font-size: 11px;"></i>
            </div>
          </div>

          <div style="margin-top: 14px; font-size: 11.5px; color: var(--text-muted); line-height: 1.5; text-align: center;">
            💡 پیام با نرخ کنترل‌شده ارسال می‌شود تا سرورهای تلگرام محدودیتی برای ربات ایجاد نکنند.
          </div>
        </div>

      </div>

      <!-- Confirmation & Sending Modal -->
      <div class="modal-overlay" *ngIf="showConfirmModal">
        <div class="modal-content" style="max-width: 440px;">
          <div class="modal-header">
            <h3 style="font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-triangle-exclamation" style="color: #fbbf24;"></i> تایید ارسال پیام
            </h3>
            <i class="fa-solid fa-xmark" style="cursor: pointer;" (click)="showConfirmModal = false" *ngIf="!sending"></i>
          </div>

          <div style="padding: 10px 0;">
            <p style="font-size: 13.5px; line-height: 1.6; margin-bottom: 14px;">
              آیا از ارسال این پیام به 
              <strong style="color: #38bdf8;">
                {{ sendToAll ? 'کلیه کاربران (' + users.length + ' کاربر)' : selectedUserIds.size + ' کاربر انتخاب‌شده' }}
              </strong> 
              اطمینان دارید؟
            </p>

            <div *ngIf="sending" style="margin-top: 20px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: var(--text-muted);">
                <span>در حال ارسال پیام به تلگرام...</span>
                <span>لطفاً منتظر بمانید</span>
              </div>
              <div style="background: rgba(255,255,255,0.08); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #6366f1, #38bdf8); height: 100%; width: 100%; animation: pulse 1.5s infinite;"></div>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;" *ngIf="!sending">
            <button type="button" class="k-btn k-btn-outline" (click)="showConfirmModal = false">انصراف</button>
            <button type="button" class="k-btn k-btn-primary" (click)="executeBroadcast()">
              <i class="fa-solid fa-check"></i> بله، شروع ارسال
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse {
      0% { opacity: 0.4; }
      50% { opacity: 1; }
      100% { opacity: 0.4; }
    }
  `]
})
export class BroadcastComponent implements OnInit {
  users: any[] = [];
  selectedUserIds = new Set<number>();
  sendToAll = true;
  searchQuery = '';
  messageText = '📢 اطلاعیه مهم:\n\nکاربران گرامی نامحدود نت، تمامی کانفیگ‌ها با سرعت بالا به‌روزرسانی شدند. در صورت نیاز به بررسی وضعیت، از دکمه «اشتراک‌های من» در ربات استفاده فرمایید.\n\n⚡️ سرعت و پایداری نامحدود نت';
  
  sending = false;
  showConfirmModal = false;
  lastResult: any = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.api.getUsers().subscribe({
      next: (res) => {
        this.users = res || [];
      },
      error: (err) => console.error('Error fetching users:', err)
    });
  }

  get filteredUsers() {
    if (!this.searchQuery.trim()) return this.users;
    const q = this.searchQuery.toLowerCase().trim();
    return this.users.filter(u =>
      String(u.userId).includes(q) ||
      (u.userName && u.userName.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  }

  toggleUser(userId: number) {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  }

  selectAll() {
    this.filteredUsers.forEach(u => this.selectedUserIds.add(u.userId));
  }

  deselectAll() {
    this.selectedUserIds.clear();
  }

  insertText(txt: string) {
    this.messageText += txt;
  }

  wrapText(prefix: string, suffix: string) {
    this.messageText += `${prefix}متن${suffix}`;
  }

  wrapCode() {
    this.messageText += ' `کد` ';
  }

  getCurrentTime(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  testSendToAdmin() {
    if (!this.messageText.trim()) return;
    this.sending = true;
    this.lastResult = null;

    // Fetch settings to get admin telegram ID
    this.api.getSettings().subscribe({
      next: (settings) => {
        const rawIds = settings.adminTelegramId || '8793231252';
        const adminId = Number(rawIds.split(/[\s,;|]+/)[0]) || 8793231252;

        this.api.broadcastMessage({
          message: this.messageText,
          targetUserIds: [adminId],
          sendToAll: false
        }).subscribe({
          next: (res) => {
            this.sending = false;
            this.lastResult = {
              success: res.success,
              message: res.success ? '✅ پیام آزمایشی با موفقیت به اکانت تلگرام ادمین ارسال شد.' : res.message
            };
          },
          error: (err) => {
            this.sending = false;
            this.lastResult = { success: false, message: 'خطا در ارسال پیام آزمایشی: ' + (err.error?.message || err.message) };
          }
        });
      },
      error: () => {
        this.sending = false;
        alert('خطا در دریافت تنظیمات ادمین.');
      }
    });
  }

  confirmBroadcast() {
    if (!this.messageText.trim()) {
      alert('لطفاً متن پیام را وارد کنید.');
      return;
    }
    if (!this.sendToAll && this.selectedUserIds.size === 0) {
      alert('لطفاً حداقل یک کاربر را انتخاب کنید.');
      return;
    }
    this.showConfirmModal = true;
  }

  executeBroadcast() {
    this.sending = true;
    this.lastResult = null;

    const payload = {
      message: this.messageText,
      targetUserIds: this.sendToAll ? [] : Array.from(this.selectedUserIds),
      sendToAll: this.sendToAll
    };

    this.api.broadcastMessage(payload).subscribe({
      next: (res) => {
        this.sending = false;
        this.showConfirmModal = false;
        this.lastResult = res;
      },
      error: (err) => {
        this.sending = false;
        this.showConfirmModal = false;
        this.lastResult = {
          success: false,
          message: 'خطا در اجرای ارسال پیام: ' + (err.error?.message || err.message)
        };
      }
    });
  }
}
