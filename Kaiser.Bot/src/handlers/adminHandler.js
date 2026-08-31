import { apiClient } from '../services/apiClient.js';
import { keyboards } from './keyboards.js';

export const adminHandler = {
  // Open Admin Panel
  async handleAdminMenu(ctx) {
    const userId = ctx.from.id;
    try {
      const user = await apiClient.getOrCreateUser(userId, ctx.from.username, ctx.from.first_name);
      if (user.isAdmin !== 1) {
        return ctx.reply('⛔ شما دسترسی به پنل مدیریت ندارید.');
      }

      await ctx.reply('👑 **پنل مدیریت ربات Kaiser**\nلطفاً یکی از بخش‌های زیر را انتخاب کنید:', keyboards.adminPanelInline());
    } catch (err) {
      console.error('Error in handleAdminMenu:', err);
      ctx.reply('❌ خطا در باز کردن پنل مدیریت.');
    }
  },

  // Admin Stats
  async handleStats(ctx) {
    try {
      const stats = await apiClient.getDashboard();
      const revenueToman = (stats.totalRevenue || 0).toLocaleString('fa-IR');

      const text = `📊 **گزارش و آمار جامع ربات Kaiser:**

👥 **کل کاربران:** ${(stats.totalUsers || 0).toLocaleString('fa-IR')} نفر
⚡ **سرویس‌های فعال:** ${(stats.activeServices || 0).toLocaleString('fa-IR')} عدد
🖥️ **نودهای سرور:** ${stats.onlineServers} آنلاین از ${stats.totalServers} سرور
🧾 **سفارشات موفق:** ${(stats.totalOrders || 0).toLocaleString('fa-IR')} عدد
💰 **مجموع درآمد:** ${revenueToman} تومان
🎟️ **کدهای تخفیف فعال:** ${stats.activeDiscounts || 0} عدد
💬 **تیکت‌های در انتظار:** ${stats.pendingTickets || 0} عدد`;

      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🔙 بازگشت به پنل مدیریت', callback_data: 'admin_back' }]]
        }
      });
    } catch (err) {
      console.error('Error in handleStats:', err);
      ctx.reply('❌ خطا در دریافت آمار ربات.');
    }
  }
};
