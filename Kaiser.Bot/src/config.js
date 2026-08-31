import dotenv from 'dotenv';
dotenv.config();

export const config = {
    botToken: process.env.BOT_TOKEN || '8992025570:AAHsMAOG5_UbZXMW_CrkmufBq-4IW4I31zI',
    apiId: parseInt(process.env.API_ID || '36814355', 10),
    apiHash: process.env.API_HASH || '1138b0ad3caf2d93a315cf9be02293b0',
    webhookUrl: process.env.WEBHOOK_URL || 'https://botrohamapi.goodino24.ir',
    backendUrl: process.env.BACKEND_URL || 'http://kaiser-backend:5000',
    ownerId: parseInt(process.env.OWNER_ID || '8793231252', 10),
    port: parseInt(process.env.PORT || '3000', 10),
    useWebhook: process.env.USE_WEBHOOK !== 'false' && process.env.USE_WEBHOOK !== '0',
    requiredChannel: '@namahdoodnet',
    channelUrl: 'https://t.me/namahdoodnet'
};
