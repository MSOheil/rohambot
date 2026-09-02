import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import QRCode from 'qrcode';
import { config } from './config.js';
import { logger } from './services/logger.js';
import { apiClient } from './services/apiClient.js';
import { keyboards } from './handlers/keyboards.js';
import { userHandler } from './handlers/userHandler.js';
import { adminHandler } from './handlers/adminHandler.js';
import { nightMessageService } from './services/nightMessageService.js';

const bot = new Telegraf(config.botToken);

// User Session / Step in-memory store
const userState = new Map();

// Helper: Check Telegram Channel Membership
async function checkChannelMembership(ctx, userId) {
  if (userId === config.ownerId) return true;

  try {
    const member = await ctx.telegram.getChatMember(config.requiredChannel, userId);
    const validStatuses = ['creator', 'administrator', 'member', 'restricted'];
    return validStatuses.includes(member.status);
  } catch (err) {
    logger.warn(`Channel membership check warning for ${userId}`, { error: err.message }, 'CHANNEL_LOCK');
    return false;
  }
}

// Helper: Send Mandatory Channel Lock Message
async function sendLockChannelMessage(ctx) {
  // STRICT: Never ever send lock channel message to channels, groups, or supergroups
  if (!ctx.chat || ctx.chat.type !== 'private') {
    return;
  }

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

// Global Telegraf Error Handler
bot.catch((err, ctx) => {
  logger.error(`Error handling update ${ctx.update?.update_id}`, err, 'TELEGRAM_ERROR', {
    update_type: ctx.updateType,
    from: ctx.from
  });
});

// Global Middleware
bot.use(async (ctx, next) => {
  // STRICT: Only process private (DM) chats with users.
  // Completely ignore channels, supergroups, and groups so the bot NEVER posts in the channel.
  if (!ctx.chat || ctx.chat.type !== 'private') {
    return;
  }

  if (!ctx.from) return;

  // Log incoming interaction
  if (ctx.message?.text) {
    logger.update(`Incoming text message from [${ctx.from.id}] @${ctx.from.username || 'unknown'}`, {
      text: ctx.message.text,
      userId: ctx.from.id
    });
  } else if (ctx.callbackQuery?.data) {
    logger.update(`Incoming callback query from [${ctx.from.id}] @${ctx.from.username || 'unknown'}`, {
      data: ctx.callbackQuery.data,
      userId: ctx.from.id
    });
  }

  // Auto register / update user in background
  try {
    apiClient.getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name).catch(() => {});
  } catch {}

  // Handle re-check callback query specifically
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'check_channel_join') {
    const isMember = await checkChannelMembership(ctx, ctx.from.id);
    if (isMember) {
      logger.info(`User [${ctx.from.id}] passed channel membership check`, { userId: ctx.from.id }, 'CHANNEL_LOCK');
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
bot.start(async (ctx) => {
  logger.userAction(ctx.from.id, 'START_BOT', { payload: ctx.message?.text });
  return userHandler.handleStart(ctx);
});

bot.hears('🛍️ خرید اشتراک', async (ctx) => {
  logger.userAction(ctx.from.id, 'VIEW_SHOP');
  return userHandler.handleShop(ctx);
});

bot.hears('🎁 تست رایگان', async (ctx) => {
  logger.userAction(ctx.from.id, 'REQUEST_FREE_TEST');
  return userHandler.handleFreeTest(ctx);
});

bot.hears('👤 حساب کاربری', async (ctx) => {
  logger.userAction(ctx.from.id, 'VIEW_ACCOUNT');
  return userHandler.handleMyAccount(ctx);
});

bot.hears('📋 اشتراک‌های من', async (ctx) => {
  logger.userAction(ctx.from.id, 'VIEW_MY_SERVICES');
  return userHandler.handleMyServices(ctx);
});

bot.hears('📲 برنامه‌های اتصال', async (ctx) => {
  logger.userAction(ctx.from.id, 'VIEW_APPS');
  return userHandler.handleApps(ctx);
});

bot.hears('👑 پنل مدیریت', async (ctx) => {
  logger.userAction(ctx.from.id, 'OPEN_ADMIN_PANEL');
  return adminHandler.handleAdminMenu(ctx);
});

bot.hears('💬 پشتیبانی و تیکت', async (ctx) => {
  userState.set(ctx.from.id, { step: 'waiting_ticket_text' });
  logger.userAction(ctx.from.id, 'START_SUPPORT_TICKET');
  await ctx.reply('💬 **لطفاً متن پیام یا مشکل خود را ارسال کنید تا برای تیم پشتیبانی ارسال شود:**', keyboards.cancelKeyboard());
});

bot.hears('💳 کیف پول', async (ctx) => {
  logger.userAction(ctx.from.id, 'VIEW_WALLET');
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
  logger.userAction(ctx.from.id, 'CANCEL_AND_RETURN_MENU');
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
      logger.userAction(userId, 'SELECT_CATEGORY', { catId });
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
      logger.userAction(userId, 'SELECT_PLAN', { planId });
      const catalog = await apiClient.getCatalog();
      const plan = catalog.plans?.find(p => p.id === planId);

      if (!plan) return ctx.answerCbQuery('پلن یافت نشد.');

      const orderRes = await apiClient.createOrder({
        userId: userId,
        planId: plan.id,
        type: 'sub'
      });

      logger.info(`Order #${orderRes.orderId} created for user [${userId}]`, { orderId: orderRes.orderId, planId, finalPrice: orderRes.finalPrice }, 'ORDER');

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
      logger.userAction(userId, 'CHOOSE_CARD_PAYMENT', { orderId });

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
      logger.userAction(userId, 'CHOOSE_ONLINE_PAYMENT', { orderId, payUrl });

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
    logger.error('Callback query processing error', err, 'CALLBACK_ERROR', { data, userId });
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

      logger.info(`Receipt photo received from user [${userId}] for order #${state.orderId}`, {
        userId,
        orderId: state.orderId
      }, 'PAYMENT_RECEIPT');

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
      } catch (notifyErr) {
        logger.error('Failed to notify owner about payment receipt', notifyErr, 'NOTIFICATION_ERROR');
      }
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
    logger.info(`Support ticket created by user [${userId}]`, { userId, text: ctx.message.text }, 'SUPPORT_TICKET');

    await ctx.reply('✅ پیام پشتیبانی شما با موفقیت ثبت شد. پاسخ به زودی از همین طریق برای شما ارسال خواهد شد.', keyboards.mainMenu(user.isAdmin === 1));

    try {
      await bot.telegram.sendMessage(config.ownerId, `📩 **تیکت پشتیبانی جدید:**\n\n👤 از: [${ctx.from.first_name}](tg://user?id=${userId})\n📝 متن: ${ctx.message.text}`, { parse_mode: 'Markdown' });
    } catch (err) {
      logger.error('Failed to forward support ticket to owner', err, 'NOTIFICATION_ERROR');
    }
    return;
  }
});

// Launch Bot (Auto-Webhook or Long-Polling)
async function startBot() {
  const webhookEndpoint = `${config.webhookUrl.replace(/\/+$/, '')}/bot-webhook`;

  logger.info('🚀 Starting Kaiser Bot Application...', {
    useWebhook: config.useWebhook,
    webhookEndpoint,
    port: config.port,
    ownerId: config.ownerId
  }, 'STARTUP');

  if (config.useWebhook) {
    const app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Status endpoint
    app.get('/', async (req, res) => {
      let botInfo = bot.botInfo;
      if (!botInfo) {
        try { botInfo = await bot.telegram.getMe(); } catch {}
      }
      res.json({
        status: 'online',
        service: 'Kaiser Telegram Bot',
        bot: botInfo ? `@${botInfo.username}` : 'unknown',
        webhookUrl: webhookEndpoint,
        mode: 'webhook'
      });
    });

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', time: new Date().toISOString() });
    });

    // Real-time Telegram Webhook Info
    app.get('/webhook-info', async (req, res) => {
      try {
        const info = await bot.telegram.getWebhookInfo();
        logger.webhook('Webhook info inspected', info);
        res.json({ success: true, webhookInfo: info });
      } catch (err) {
        logger.error('Error fetching getWebhookInfo', err, 'WEBHOOK');
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Force re-register Telegram Webhook
    app.get('/set-webhook', async (req, res) => {
      try {
        logger.webhook(`Manually triggering setWebhook to: ${webhookEndpoint}`);
        await bot.telegram.setWebhook(webhookEndpoint, {
          drop_pending_updates: true,
          allowed_updates: ['message', 'callback_query', 'channel_post', 'chat_member']
        });
        const info = await bot.telegram.getWebhookInfo();
        logger.webhook('Webhook re-registered successfully', info);
        res.json({ success: true, message: 'Webhook set successfully', webhookInfo: info });
      } catch (err) {
        logger.error('Error in manual setWebhook', err, 'WEBHOOK');
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Delete Webhook
    app.get('/delete-webhook', async (req, res) => {
      try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        logger.webhook('Webhook deleted from Telegram API');
        res.json({ success: true, message: 'Webhook deleted' });
      } catch (err) {
        logger.error('Error deleting webhook', err, 'WEBHOOK');
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Telegram Bot Webhook Receiver
    app.post('/bot-webhook', async (req, res) => {
      try {
        if (req.body && req.body.update_id) {
          await bot.handleUpdate(req.body, res);
        } else {
          res.sendStatus(200);
        }
      } catch (err) {
        logger.error('Error processing Telegram update in /bot-webhook', err, 'TELEGRAM_ERROR');
        if (!res.headersSent) res.sendStatus(500);
      }
    });

    // Fallback for root POST
    app.post('/', async (req, res, next) => {
      if (req.body && req.body.update_id) {
        try {
          await bot.handleUpdate(req.body, res);
        } catch (err) {
          logger.error('Error processing root update in /', err, 'TELEGRAM_ERROR');
          if (!res.headersSent) res.sendStatus(500);
        }
      } else {
        next();
      }
    });

    // Start Express Web Server
    app.listen(config.port, async () => {
      logger.info(`Webhook HTTP server listening on port ${config.port}`, { port: config.port }, 'HTTP_SERVER');

      // Auto-set Webhook on startup with retry mechanism
      let retries = 5;
      while (retries > 0) {
        try {
          const me = await bot.telegram.getMe();
          bot.botInfo = me;
          logger.info(`Telegram Bot Authenticated: @${me.username} (${me.first_name} [${me.id}])`, { bot: me }, 'AUTH');

          logger.webhook(`Auto-setting Telegram Webhook for token to: ${webhookEndpoint}...`, {
            url: webhookEndpoint,
            drop_pending_updates: true
          });

          await bot.telegram.setWebhook(webhookEndpoint, {
            drop_pending_updates: true,
            allowed_updates: ['message', 'callback_query']
          });

          const webhookInfo = await bot.telegram.getWebhookInfo();
          logger.webhook('Telegram Webhook registered successfully in Telegram API', webhookInfo);
          break;
        } catch (err) {
          retries--;
          logger.error(`Failed to auto-set Telegram Webhook (${5 - retries}/5)`, err, 'WEBHOOK_RETRY', {
            remainingRetries: retries,
            webhookEndpoint
          });
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 4000));
          } else {
            logger.error('Could not set Telegram Webhook after 5 attempts. Check internet connectivity to api.telegram.org.', err, 'WEBHOOK_FAILED');
          }
        }
      }
    });
  } else {
    // Delete any existing webhook and start polling
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      logger.webhook('Deleted existing webhook for polling mode');
    } catch {}
    bot.launch();
    logger.info('Kaiser Bot running in Long-Polling mode...', null, 'POLLING');
  }

  // Start automated Good Night message scheduler (Asia/Tehran)
  nightMessageService.start(bot);
}

// Global Process Error Handlers
process.on('uncaughtException', (err) => {
  logger.error('Fatal Uncaught Exception in Process', err, 'FATAL_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Fatal Unhandled Rejection in Process', reason instanceof Error ? reason : new Error(String(reason)), 'UNHANDLED_REJECTION');
});

startBot().catch(err => logger.error('Fatal error starting Kaiser Bot', err, 'FATAL_STARTUP'));

// Graceful stop
process.once('SIGINT', () => {
  logger.info('Stopping Kaiser Bot (SIGINT)...', null, 'SHUTDOWN');
  nightMessageService.stop();
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  logger.info('Stopping Kaiser Bot (SIGTERM)...', null, 'SHUTDOWN');
  nightMessageService.stop();
  bot.stop('SIGTERM');
});
