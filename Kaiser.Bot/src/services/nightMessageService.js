import { apiClient } from './apiClient.js';
import { logger } from './logger.js';

// Get current Tehran (Iran) time: HH:mm (24-hour)
export function getTehranTime(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(date);
  } catch (err) {
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

// Get current Tehran date: YYYY-MM-DD
export function getTehranDate(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  } catch (err) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

class NightMessageService {
  constructor() {
    this.lastSentDate = null;
    this.isSending = false;
    this.timer = null;
  }

  start(bot) {
    if (this.timer) return;

    logger.info('🌙 Night Message Scheduler initialized (Timezone: Asia/Tehran)', null, 'NIGHT_MSG');

    // Check every 30 seconds
    this.timer = setInterval(async () => {
      await this.checkAndSend(bot);
    }, 30000);

    // Initial check on startup
    this.checkAndSend(bot).catch(() => {});
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async checkAndSend(bot) {
    if (this.isSending) return;

    try {
      const currentTimeTehran = getTehranTime();
      const currentDateTehran = getTehranDate();

      // Fetch latest settings from backend
      const settings = await apiClient.getSettings();
      if (!settings) return;

      // Check if night message is enabled (1 or true)
      const isEnabled = settings.nightMessageEnabled === 1 || settings.nightMessageEnabled === true;
      if (!isEnabled) return;

      // Target time (default 23:00)
      const targetTimeRaw = (settings.nightMessageTime || '23:00').trim();
      const targetParts = targetTimeRaw.split(':');
      const targetTimeFormatted = `${String(targetParts[0] || '23').padStart(2, '0')}:${String(targetParts[1] || '00').padStart(2, '0')}`;

      // Check if time matches and haven't sent today
      if (currentTimeTehran === targetTimeFormatted && this.lastSentDate !== currentDateTehran) {
        this.lastSentDate = currentDateTehran;
        this.isSending = true;

        const messageText = settings.nightMessageText ||
          '🌙 شب شما بخیر و آرامش!\n\n✨ با تشکر از همراهی شما با نامحدود نت. تمامی سرورها و کانفیگ‌ها پایدار و با سرعت بالا در دسترس شما هستند.\n\nشبتون پر از آرامش 💫';

        logger.info(`🌙 Starting Good Night message broadcast for [${currentDateTehran} ${currentTimeTehran}] Tehran time...`, {
          targetTime: targetTimeFormatted,
          currentTehranTime: currentTimeTehran
        }, 'NIGHT_MSG');

        await this.broadcastNightMessage(bot, messageText, settings);
      }
    } catch (err) {
      logger.warn('Error during night message check', { error: err.message }, 'NIGHT_MSG');
    } finally {
      this.isSending = false;
    }
  }

  async broadcastNightMessage(bot, messageText, settings) {
    try {
      const userIds = await apiClient.getAllUserIds();
      if (!Array.isArray(userIds) || userIds.length === 0) {
        logger.info('No registered users found for night message broadcast.', null, 'NIGHT_MSG');
        return;
      }

      logger.info(`Broadcasting Good Night message to ${userIds.length} users...`, { count: userIds.length }, 'NIGHT_MSG');

      let successCount = 0;
      let failCount = 0;

      for (const userId of userIds) {
        try {
          await bot.telegram.sendMessage(userId, messageText, { parse_mode: 'Markdown' });
          successCount++;
        } catch (err) {
          failCount++;
          // Common telegram error codes when user blocked bot or deleted account:
          // 403 (bot was blocked by user), 400 (chat not found) - ignore gracefully
        }

        // 40ms delay between sends (~25 msgs/sec) to stay safely within Telegram 30 msgs/sec limit
        await new Promise(r => setTimeout(r, 40));
      }

      logger.info(`✅ Night message broadcast completed. Sent: ${successCount}, Failed/Blocked: ${failCount}`, {
        successCount,
        failCount
      }, 'NIGHT_MSG');

      // Notify admin
      const adminIds = (settings.adminTelegramId || '8793231252,8429466517')
        .split(/[\s,;|]+/)
        .map(id => id.trim())
        .filter(id => id && !isNaN(Number(id)));

      const adminReport = `🌙 **گزارش ارسال خودکار پیام شب‌بخیر:**\n\n` +
        `⏰ **زمان ارسال:** ${getTehranTime()} (به وقت تهران)\n` +
        `✅ **ارسال موفق:** ${successCount.toLocaleString('fa-IR')} کاربر\n` +
        `⚠️ **ناموفق یا بلاک:** ${failCount.toLocaleString('fa-IR')} کاربر`;

      for (const adminId of adminIds) {
        try {
          await bot.telegram.sendMessage(adminId, adminReport, { parse_mode: 'Markdown' });
        } catch {}
      }
    } catch (err) {
      logger.error('Fatal error during night message broadcast', err, 'NIGHT_MSG');
    }
  }
}

export const nightMessageService = new NightMessageService();
