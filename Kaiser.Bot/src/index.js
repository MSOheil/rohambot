import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import QRCode from 'qrcode';
import { config } from './config.js';
import { apiClient } from './services/apiClient.js';
import { keyboards } from './handlers/keyboards.js';
import { userHandler } from './handlers/userHandler.js';
import { adminHandler } from './handlers/adminHandler.js';

const bot = new Telegraf(config.botToken);

// User Session / Step in-memory store
const userState = new Map();

// Helper: Check Telegram Channel Membership
async function checkChannelMembership(ctx, userId) {
  // Bypass check for owner/admin
  if (userId === config.ownerId) return true;

  try {
    const member = await ctx.telegram.getChatMember(config.requiredChannel, userId);
    const validStatuses = ['creator', 'administrator', 'member', 'restricted'];
    return validStatuses.includes(member.status);
  } catch (err) {
    console.error(`Channel membership check error for ${userId}:`, err.message);
    return false;
  }
}

// Helper: Send Mandatory Channel Lock Message
async function sendLockChannelMessage(ctx) {
  const text = `⚠️ **کاربر گرامی، برای استفاده از امکانات ربات عضویت در کانال زیر الزامی است:**

📢 **کانال اطلاع‌رسانی:** ${config.requiredChannel}
🔗 **لینک عضویت:** ${config.channelUrl}

👈 لطفاً ابتدا وارد کانال شده و دکمه **«Join»** را بزنید، سپس بر روی دکمه **«🔄 بررسی عضویت و ورود به ربات»** در زیر کلیک فرمایید:`;

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...keyboards.lockChannelInline()
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...keyboards.lockChannelInline()
      });
    }
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...keyboards.lockChannelInline()
    });
  }
}

// Global Middleware
bot.use(async (ctx, next) => {
  if (!ctx.from) return next();

  // Auto register / update user in background
  try {
    apiClient.getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name).catch(() => {});
  } catch {}

  // Handle re-check callback query specifically
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'check_channel_join') {
    const isMember = await checkChannelMembership(ctx, ctx.from.id);
    if (isMember) {
      await ctx.answerCbQuery('✅ عضویت شما با موفقیت تایید شد! خوش آمدید.');
      try { await ctx.deleteMessage(); } catch {}
      return userHandler.handleStart(ctx);
    } else {
      return ctx.answerCbQuery('⚠️ شما هنوز در کانال عضو نشده‌اید! لطفاً ابتدا دکمه عضویت در کانال را بزنید.', { show_alert: true });
    }
  }

  // Check channel membership for all commands & interactions
  const isMember = await checkChannelMembership(ctx, ctx.from.id);
  if (!isMember) {
    return sendLockChannelMessage(ctx);
  }

  return next();
});

// Commands
bot.start(userHandler.handleStart);
bot.hears('🛍️ خرید اشتراک', userHandler.handleShop);
bot.hears('🎁 تست رایگان', userHandler.handleFreeTest);
bot.hears('👤 حساب کاربری', userHandler.handleMyAccount);
bot.hears('📋 اشتراک‌های من', userHandler.handleMyServices);
bot.hears('📲 برنامه‌های اتصال', userHandler.handleApps);
bot.hears('👑 پنل مدیریت', adminHandler.handleAdminMenu);

bot.hears('💬 پشتیبانی و تیکت', async (ctx) => {
  userState.set(ctx.from.id, { step: 'waiting_ticket_text' });
  await ctx.reply('💬 **لطفاً متن پیام یا مشکل خود را ارسال کنید تا برای تیم پشتیبانی ارسال شود:**', keyboards.cancelKeyboard());
});

bot.hears('💳 کیف پول', async (ctx) => {
  const user = await apiClient.getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
  const walletToman = (user.wallet || 0).toLocaleString('fa-IR');
  const text = `💳 **کیف پول حساب شما**\n\n💰 **موجودی فعلی:** ${walletToman} تومان\n\nجهت انتقال موجودی به کاربر دیگر یا شارژ کیف پول از گزینه‌های زیر استفاده نمایید.`;
  await ctx.reply(text, Markup.inlineKeyboard([
    [Markup.button.callback('🔄 انتقال اعتبار به کاربر دیگر', 'wallet_transfer')],
    [Markup.button.callback('💳 شارژ کیف پول', 'wallet_charge')]
  ]));
});

bot.hears('❌ لغو و بازگشت به منوی اصلی', async (ctx) => {
  userState.delete(ctx.from.id);
  const user = await apiClient.getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
  await ctx.reply('عملیات لغو شد. به منوی اصلی بازگشتید.', keyboards.mainMenu(user.isAdmin === 1));
});

// Callback Queries
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;

  try {
    // Select Category -> Show Plans
    if (data.startsWith('cat_')) {
      const catId = parseInt(data.replace('cat_', ''), 10);
      const catalog = await apiClient.getCatalog();
      const cat = catalog.categories?.find(c => c.id === catId);

      await ctx.editMessageText(`📦 **پلن‌های موجود در دسته‌بندی «${cat?.title || ''}»:**\nلطفاً پلن مورد نظر خود را انتخاب کنید:`, {
        parse_mode: 'Markdown',
        ...keyboards.plansInline(catalog.plans || [], catId)
      });
      return ctx.answerCbQuery();
    }

    // Select Plan -> Create Order & Show Payment Options
    if (data.startsWith('plan_')) {
      const planId = parseInt(data.replace('plan_', ''), 10);
      const catalog = await apiClient.getCatalog();
      const plan = catalog.plans?.find(p => p.id === planId);

      if (!plan) return ctx.answerCbQuery('پلن یافت نشد.');

      const orderRes = await apiClient.createOrder({
        userId: userId,
        planId: plan.id,
        type: 'sub'
      });

      const priceToman = (orderRes.finalPrice).toLocaleString('fa-IR');
      const text = `🛍️ **پیش‌فاکتور سفارش #${orderRes.orderId}**

📦 **پلن انتخابی:** ${plan.planName}
⏳ **مدت اعتبار:** ${plan.monthCount} ماهه
💰 **مبلغ قابل پرداخت:** ${priceToman} تومان

لطفاً روش پرداخت را انتخاب فرمایید:`;

      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...keyboards.paymentMethodsInline(orderRes.orderId, orderRes.finalPrice)
      });
      return ctx.answerCbQuery();
    }

    // Card to Card Payment
    if (data.startsWith('pay_card_')) {
      const orderId = parseInt(data.replace('pay_card_', ''), 10);
      const settings = await apiClient.getSettings();

      userState.set(userId, { step: 'waiting_card_receipt', orderId });

      const text = `💳 **اطلاعات کارت جهت واریز وجه:**

💳 **شماره کارت:** \`${settings.cardAdminNumber || '6037-9918-7261-5490'}\`
👤 **به نام:** ${settings.cardAdminName || 'مدیریت کایزر'}

📝 ${settings.alertCard || 'لطفا پس از واریز، تصویر فیش واریزی را ارسال نمایید.'}

📌 **شماره سفارش:** \`#${orderId}\``;

      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboards.cancelKeyboard() });
      return ctx.answerCbQuery();
    }

    // Online Payment
    if (data.startsWith('pay_online_')) {
      const orderId = parseInt(data.replace('pay_online_', ''), 10);
      const payUrl = `${config.backendUrl}/onlinepay?orderId=${orderId}`;

      await ctx.reply(`🌐 **جهت پرداخت آنلاین امن روی لینک زیر کلیک کنید:**\n\n🔗 [ورود به درگاه پرداخت زیبال](${payUrl})`, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      return ctx.answerCbQuery();
    }

    // Admin Panel Actions
    if (data === 'admin_stats') return adminHandler.handleStats(ctx);
    if (data === 'admin_back') return adminHandler.handleAdminMenu(ctx);
    if (data === 'admin_exit') {
      await ctx.deleteMessage();
      return ctx.answerCbQuery('از پنل مدیریت خارج شدید.');
    }

    if (data === 'back_cats') {
      const catalog = await apiClient.getCatalog();
      await ctx.editMessageText('🛍️ **لطفاً یکی از دسته‌بندی‌های زیر را برای خرید اشتراک انتخاب کنید:**', keyboards.categoriesInline(catalog.categories));
      return ctx.answerCbQuery();
    }

    ctx.answerCbQuery();
  } catch (err) {
    console.error('Callback error:', err);
    ctx.answerCbQuery('خطایی رخ داد.');
  }
});

// Text and Photo Steps Handler
bot.on('message', async (ctx) => {
  const userId = ctx.from.id;
  const state = userState.get(userId);

  if (!state) return;

  // Handling Card Receipt Photo
  if (state.step === 'waiting_card_receipt') {
    if (ctx.message.photo || ctx.message.document) {
      userState.delete(userId);
      const user = await apiClient.getOrCreateUser(userId, ctx.from.username, ctx.from.first_name);

      await ctx.reply('✅ **تصویر فیش دریافت شد.**\nفیش واریزی شما برای مدیریت ارسال شد و در اسرع وقت بررسی و تایید خواهد شد.', keyboards.mainMenu(user.isAdmin === 1));

      // Notify Owner
      try {
        const notifyText = `🔔 **فیش واریزی جدید ثبت شد!**\n\n👤 **کاربر:** [${ctx.from.first_name}](tg://user?id=${userId}) (\`${userId}\`)\n📌 **شماره سفارش:** #${state.orderId}`;
        await bot.telegram.sendMessage(config.ownerId, notifyText, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ تایید و صدور خودکار', `admin_approve_${state.orderId}`),
              Markup.button.callback('❌ رد فیش', `admin_reject_${state.orderId}`)
            ]
          ])
        });
      } catch {}
      return;
    } else {
      return ctx.reply('⚠️ لطفاً تصویر فیش واریزی خود را ارسال کنید یا دکمه لغو را بزنید.');
    }
  }

  // Handling Support Ticket
  if (state.step === 'waiting_ticket_text' && ctx.message.text) {
    userState.delete(userId);
    const user = await apiClient.getOrCreateUser(userId, ctx.from.username, ctx.from.first_name);

    await apiClient.createTicket(userId, ctx.message.text);
    await ctx.reply('✅ پیام پشتیبانی شما با موفقیت ثبت شد. پاسخ به زودی از همین طریق برای شما ارسال خواهد شد.', keyboards.mainMenu(user.isAdmin === 1));

    try {
      await bot.telegram.sendMessage(config.ownerId, `📩 **تیکت پشتیبانی جدید:**\n\n👤 از: [${ctx.from.first_name}](tg://user?id=${userId})\n📝 متن: ${ctx.message.text}`, { parse_mode: 'Markdown' });
    } catch {}
    return;
  }
});

// Launch Bot (Auto-Webhook or Long-Polling)
async function startBot() {
  const webhookEndpoint = `${config.webhookUrl.replace(/\/+$/, '')}/bot-webhook`;

  if (config.useWebhook) {
    const app = express();
    app.use(express.json());

    // Telegraf webhook callback route
    app.use(bot.webhookCallback('/bot-webhook'));

    app.get('/', (req, res) => res.json({ status: 'ok', service: 'KaiserBotWebhook' }));

    app.listen(config.port, async () => {
      console.log(`🌐 Webhook HTTP server listening on port ${config.port}`);
      try {
        console.log(`📡 Auto-setting Telegram Webhook to: ${webhookEndpoint}...`);
        await bot.telegram.setWebhook(webhookEndpoint, {
          drop_pending_updates: true,
          allowed_updates: ['message', 'callback_query', 'channel_post', 'chat_member']
        });
        const webhookInfo = await bot.telegram.getWebhookInfo();
        console.log(`✅ Telegram Webhook registered successfully:`, webhookInfo.url);
      } catch (err) {
        console.error(`❌ Failed to auto-set Telegram Webhook:`, err.message);
      }
    });
  } else {
    // Delete any existing webhook and start polling
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    } catch {}
    bot.launch();
    console.log('🚀 Kaiser Bot running in Long-Polling mode...');
  }
}

startBot().catch(err => console.error('Failed to start Kaiser Bot:', err));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
