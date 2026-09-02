import QRCode from 'qrcode';
import { apiClient } from '../services/apiClient.js';
import { keyboards } from './keyboards.js';
import { getShamsiDateTime } from '../services/logger.js';

export const userHandler = {
  // /start command
  async handleStart(ctx) {
    const from = ctx.from;
    const startPayload = ctx.message?.text?.split(' ')[1];
    let inviterId = null;
    if (startPayload && startPayload.startsWith('ref_')) {
      inviterId = parseInt(startPayload.replace('ref_', ''), 10);
    }

    try {
      const user = await apiClient.getOrCreateUser(from.id, from.username, from.first_name, inviterId);
      const defaultAdmins = ['8793231252', '8429466517'];
      const isAdmin = user.isAdmin === 1 || defaultAdmins.includes(String(from.id));

      // Fetch settings to get dynamic welcome message & admin IDs
      let settings = null;
      try {
        settings = await apiClient.getSettings();
      } catch (e) {
        console.warn('Could not fetch settings for start handler:', e.message);
      }

      // Dynamic Welcome message from database, with fallback
      const defaultWelcome = `به ربات   «نامحدود نت»   خوش آمدید.


⚡️ارائه پر سرعت و نامحدود اشتراک های V2ray برای استفاده 
شخصی و مولتی لوکیشن open vpn 
🇩🇪🇳🇱🇯🇴🇹🇷
مخصوص گیم، ترید ،فیلم سرعت 🛜بسیار بالاتر و پینگ پایین.
⏱️تحویل آنی و قابلیت مدیریت هوشمند سابسکریبشن

لطفا از منوی زیر  گزینه مورد نظر خود را انتخاب کنید👇👇👇`;

      const welcomeText = (settings && settings.welcomeMessage && settings.welcomeMessage.trim())
        ? settings.welcomeMessage
        : defaultWelcome;

      await ctx.reply(welcomeText, keyboards.mainMenu(isAdmin));

      // --- Send Comprehensive Live Telegram Report to All Admins ---
      try {
        const configuredAdmins = (settings?.adminTelegramId || process.env.OWNER_ID || '8793231252,8429466517')
          .split(/[\s,;|]+/)
          .map(id => id.trim())
          .filter(id => id && !isNaN(Number(id)));

        const targetAdminIds = [...new Set([...defaultAdmins, ...configuredAdmins])];

        const userStatus = user.isNew ? '🆕 <b>کاربر جدید (اولین ثبت‌نام)</b>' : '🔄 <b>کاربر قدیمی (ورود مجدد)</b>';
        const usernameFormatted = from.username ? `@${from.username}` : '<i>(ندارد)</i>';
        const firstName = from.first_name || '---';
        const lastName = from.last_name || '---';
        const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'کاربر بدون نام';
        const isPremium = from.is_premium ? '⭐ بله (اکانت پریمیوم)' : 'خیر (اکانت عادی)';
        const langCode = from.language_code ? from.language_code.toUpperCase() : 'نامشخص';
        const refSource = inviterId ? `<code>${inviterId}</code>` : 'مستقیم (بدون معرف)';
        const timeNow = getShamsiDateTime();
        const totalUsersCount = user.totalUsers || 1;
        const todayNewUsersCount = user.todayNewUsers || 1;
        const activeSubsCount = user.activeServices || 0;

        const reportMsg = `🔔 <b>گزارش استارت و ورود به ربات کایزر</b>

👤 <b>مشخصات فردی کاربر:</b>
├ <b>نام:</b> ${firstName}
├ <b>نام خانوادگی:</b> ${lastName}
├ <b>نام کامل:</b> ${fullName}
├ <b>نام کاربری:</b> ${usernameFormatted}
├ <b>شناسه عددی تلگرام:</b> <code>${from.id}</code>
├ <b>پروفایل مستقیم:</b> <a href="tg://user?id=${from.id}">مشاهده حساب کاربری</a>
├ <b>زبان تلگرام:</b> <code>${langCode}</code>
├ <b>وضعیت پریمیوم:</b> ${isPremium}
├ <b>معرف (Inviter):</b> ${refSource}
└ <b>وضعیت ثبت‌نام:</b> ${userStatus}

━━━━━━━━━━━━━━━━━━━
📊 <b>آمار زنده سامانه:</b>
👥 <b>کل کاربران سیستم:</b> <b>${totalUsersCount.toLocaleString('fa-IR')}</b> نفر
📅 <b>ورودی‌های جدید امروز:</b> <b>${todayNewUsersCount.toLocaleString('fa-IR')}</b> نفر
⚡ <b>اشتراک‌های فعال کل:</b> <b>${activeSubsCount.toLocaleString('fa-IR')}</b> سرویس
⏰ <b>زمان دقیق:</b> <code>${timeNow}</code>`;

        await Promise.allSettled(
          targetAdminIds.map(adminId =>
            ctx.telegram.sendMessage(adminId, reportMsg, { parse_mode: 'HTML' })
          )
        );
      } catch (adminErr) {
        console.warn('Could not send admin start report:', adminErr.message);
      }
    } catch (err) {
      console.error('Error in handleStart:', err);
      await ctx.reply('به ربات «نامحدود نت» خوش آمدید.', keyboards.mainMenu(false));
    }
  },

  // Shop menu
  async handleShop(ctx) {
    try {
      const catalog = await apiClient.getCatalog();
      if (!catalog.categories || catalog.categories.length === 0) {
        return ctx.reply('⚠️ در حال حاضر دسته‌بندی فعالی برای فروش تعریف نشده است.');
      }

      await ctx.reply('🛍️ **لطفاً یکی از دسته‌بندی‌های زیر را برای خرید اشتراک انتخاب کنید:**', keyboards.categoriesInline(catalog.categories));
    } catch (err) {
      console.error('Error in handleShop:', err);
      ctx.reply('❌ خطا در دریافت لیست پلن‌ها. لطفاً لحظاتی دیگر تلاش کنید.');
    }
  },

  // Free test
  async handleFreeTest(ctx) {
    const userId = ctx.from.id;
    try {
      await ctx.reply('⏳ در حال بررسی و صدور کانفیگ تست رایگان برای شما...');
      const res = await apiClient.getFreeTest(userId);

      if (!res.success) {
        return ctx.reply(`⚠️ ${res.message || 'امکان دریافت تست رایگان وجود ندارد.'}`);
      }

      const msg = `🎁 **اکانت تست رایگان ۲۴ ساعته شما فعال شد:**

🔗 **لینک سابسکریپشن هوشمند:**
\`${res.subUrl}\`

⚡ **کانفیگ اتصال سریع:**
\`${res.configUrls?.[0] || ''}\`

💡 *لینک سابسکریپشن را کپی کرده و در برنامه کلاینت (v2rayNG, Streisand, v2rayN) ایمپورت نمایید.*`;

      // Generate QR Code buffer
      const qrBuffer = await QRCode.toBuffer(res.subUrl, { width: 300, margin: 2 });
      await ctx.replyWithPhoto({ source: qrBuffer }, { caption: msg, parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Error in handleFreeTest:', err);
      ctx.reply('❌ خطا در صدور اکانت تست رایگان.');
    }
  },

  // My Account
  async handleMyAccount(ctx) {
    const userId = ctx.from.id;
    try {
      const user = await apiClient.getOrCreateUser(userId, ctx.from.username, ctx.from.first_name);
      const walletToman = (user.wallet || 0).toLocaleString('fa-IR');
      const botUsername = ctx.botInfo?.username || 'bot';
      const refLink = `https://t.me/${botUsername}?start=ref_${userId}`;

      const text = `👤 **اطلاعات حساب کاربری شما:**

🆔 **شناسه عددی:** \`${user.userId}\`
👤 **نام:** ${user.name || '---'}
🔹 **نام کاربری:** @${user.userName || 'ندارد'}
💰 **موجودی کیف پول:** ${walletToman} تومان
👥 **تعداد زیرمجموعه‌ها:** ${user.invited || 0} نفر
🎁 **وضعیت تست رایگان:** ${user.useFreeTrial === 1 ? '✅ استفاده شده' : '❌ استفاده نشده'}

🔗 **لینک اختصاصی دعوت شما:**
\`${refLink}\`
*(با دعوت دوستانتان از تخفیف و شارژ رایگان بهره‌مند شوید)*`;

      await ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Error in handleMyAccount:', err);
      ctx.reply('❌ خطا در دریافت اطلاعات کاربری.');
    }
  },

  // My Services
  async handleMyServices(ctx) {
    const userId = ctx.from.id;
    try {
      const services = await apiClient.getUserServices(userId);
      if (!services || services.length === 0) {
        return ctx.reply('📋 شما در حال حاضر اشتراک فعالی ندارید. می‌توانید از بخش «🛍️ خرید اشتراک» اقدام به تهیه بفرمایید.');
      }

      for (const s of services) {
        const usedGB = (s.usedBytes / (1024 * 1024 * 1024)).toFixed(2);
        const totalGBText = s.totalUsed > 0 
          ? `${(s.totalUsed / (1024 * 1024 * 1024)).toFixed(0)} گیگابایت`
          : 'نامحدود ♾️';
        const statusIcon = s.state === 1 ? '🟢 فعال' : '🔴 منقضی/غیرفعال';

        const msg = `👑 **مشخصات اشتراک #${s.id}**
📦 **پلن:** ${s.planName}
📊 **مصرف:** ${usedGB} گیگابایت از ${totalGBText}
⏳ **زمان باقی‌مانده:** ${s.daysRemaining} روز
⚡ **وضعیت:** ${statusIcon}

🔗 **لینک سابسکریپشن:**
\`${s.subLink}\``;

        const qrBuffer = await QRCode.toBuffer(s.subLink, { width: 300, margin: 2 });
        await ctx.replyWithPhoto({ source: qrBuffer }, { caption: msg, parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('Error in handleMyServices:', err);
      ctx.reply('❌ خطا در دریافت لیست اشتراک‌ها.');
    }
  },

  // App Suggestions
  async handleApps(ctx) {
    try {
      const apps = await apiClient.getApps();
      let text = `📲 **برنامه‌ها و کلاینت‌های پیشنهادی اتصال:**\n\n`;

      for (const app of apps) {
        text += `🔹 **${app.name}**\n📝 ${app.description}\n📥 [دانلود مستقیم برنامه](${app.url})\n\n`;
      }

      await ctx.reply(text, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (err) {
      console.error('Error in handleApps:', err);
      ctx.reply('❌ خطا در دریافت لیست اپلیکیشن‌ها.');
    }
  }
};
