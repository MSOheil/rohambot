import axios from 'axios';
import { config } from './config.js';

async function setupWebhook() {
  const token = config.botToken;
  const webhookUrl = `${config.webhookUrl.replace(/\/+$/, '')}/bot-webhook`;

  console.log('🤖 ========================================================');
  console.log('🤖 Kaiser Telegram Bot - Manual Webhook Registration Script');
  console.log('🤖 ========================================================');
  console.log(`🔑 Bot Token: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
  console.log(`🌐 Target Webhook URL: ${webhookUrl}`);

  const axiosInstance = axios.create({
    timeout: 12000
  });

  try {
    // 1. Check Bot Identity
    console.log('🔍 Checking bot identity on Telegram API...');
    const meRes = await axiosInstance.get(`https://api.telegram.org/bot${token}/getMe`);
    if (meRes.data && meRes.data.ok) {
      const bot = meRes.data.result;
      console.log(`✅ Bot Authenticated: @${bot.username} (${bot.first_name} [ID: ${bot.id}])`);
    }

    // 2. Set Webhook
    console.log(`📡 Sending setWebhook request to Telegram API (${webhookUrl})...`);
    const setRes = await axiosInstance.post(`https://api.telegram.org/bot${token}/setWebhook`, {
      url: webhookUrl,
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query']
    });

    console.log('📥 Telegram API Response:', setRes.data);

    // 3. Verify Webhook Info
    const infoRes = await axiosInstance.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    if (infoRes.data && infoRes.data.ok) {
      const info = infoRes.data.result;
      console.log('\n📊 ================= Current Webhook Info =================');
      console.log(`🔗 Active URL:          ${info.url}`);
      console.log(`⏳ Pending Updates:     ${info.pending_update_count}`);
      console.log(`⚠️ Last Error Message:   ${info.last_error_message || 'None'}`);
      console.log(`🕒 Last Error Date:      ${info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString() : 'None'}`);
      console.log('==========================================================\n');
    }
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      console.error('⚠️ Timeout connecting to api.telegram.org. If you are in Iran on your local machine, Telegram API is filtered. On your foreign VPS (Docker deployment) this will connect instantly.');
    } else {
      console.error('❌ Failed to set Telegram Webhook:', err.response?.data || err.message);
    }
  }
}

setupWebhook();
