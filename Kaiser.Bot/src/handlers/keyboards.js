import { Markup } from 'telegraf';

export const keyboards = {
  // Main Menu Keyboard
  mainMenu(isAdmin = false) {
    const buttons = [
      ['🛍️ خرید اشتراک', '🎁 تست رایگان'],
      ['👤 حساب کاربری', '📋 اشتراک‌های من'],
      ['🔄 تمدید اشتراک', '👥 کسب درآمد و زیرمجموعه'],
      ['📲 برنامه‌های اتصال', '💬 پشتیبانی و تیکت'],
      ['💳 کیف پول']
    ];

    if (isAdmin) {
      buttons.push(['👑 پنل مدیریت']);
    }

    return Markup.keyboard(buttons).resize();
  },

  // Cancel Keyboard
  cancelKeyboard() {
    return Markup.keyboard([['❌ لغو و بازگشت به منوی اصلی']]).resize();
  },

  // Mandatory Channel Lock Inline Keyboard
  lockChannelInline() {
    return Markup.inlineKeyboard([
      [Markup.button.url('📢 عضویت در کانال تلگرام', 'https://t.me/namahdoodnet')],
      [Markup.button.callback('🔄 بررسی عضویت و ورود به ربات', 'check_channel_join')]
    ]);
  },

  // Category List Inline Keyboard
  categoriesInline(categories) {
    const buttons = categories.map(c => [
      Markup.button.callback(`📁 ${c.title}`, `cat_${c.id}`)
    ]);
    buttons.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
    return Markup.inlineKeyboard(buttons);
  },

  // Plans List Inline Keyboard
  plansInline(plans, catId) {
    const buttons = plans
      .filter(p => p.catId === catId || catId === 0)
      .map(p => {
        const priceToman = (p.price).toLocaleString('fa-IR');
        return [Markup.button.callback(`⚡ ${p.planName} | ${priceToman} تومان`, `plan_${p.id}`)];
      });
    buttons.push([Markup.button.callback('🔙 بازگشت به دسته‌ها', 'back_cats')]);
    return Markup.inlineKeyboard(buttons);
  },

  // Payment Methods Inline Keyboard
  paymentMethodsInline(orderId, finalPrice) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('💳 پرداخت کارت به کارت', `pay_card_${orderId}`)],
      [Markup.button.callback('🌐 درگاه پرداخت آنلاین', `pay_online_${orderId}`)],
      [Markup.button.callback('💰 پرداخت از کیف پول', `pay_wallet_${orderId}`)],
      [Markup.button.callback('🎟️ اعمال کد تخفیف', `apply_discount_${orderId}`)],
      [Markup.button.callback('❌ لغو سفارش', `cancel_order_${orderId}`)]
    ]);
  },

  // Admin Panel Inline Keyboard
  adminPanelInline() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📊 آمار و گزارشات', 'admin_stats'),
        Markup.button.callback('📢 پیام همگانی', 'admin_broadcast')
      ],
      [
        Markup.button.callback('🖥️ وضعیت سرورها', 'admin_servers'),
        Markup.button.callback('👥 مدیریت کاربران', 'admin_users')
      ],
      [
        Markup.button.callback('📦 مدیریت پلن‌ها', 'admin_plans'),
        Markup.button.callback('🧾 فیش‌های در انتظار', 'admin_pending_orders')
      ],
      [
        Markup.button.callback('⚙️ تنظیمات ربات', 'admin_settings'),
        Markup.button.callback('🔙 خروج از پنل', 'admin_exit')
      ]
    ]);
  }
};
