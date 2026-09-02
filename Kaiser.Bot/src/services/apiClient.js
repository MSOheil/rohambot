import axios from 'axios';
import { config } from '../config.js';

const api = axios.create({
  baseURL: config.backendUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const apiClient = {
  // User APIs
  async getOrCreateUser(telegramId, userName, name, inviterId) {
    const res = await api.get(`/api/bot/user/${telegramId}`, {
      params: { userName, name, inviterId }
    });
    return res.data;
  },

  async updateUserStep(telegramId, step) {
    const res = await api.post(`/api/bot/user/${telegramId}/step`, { step });
    return res.data;
  },

  // Settings & Catalog
  async getSettings() {
    const res = await api.get('/api/bot/settings');
    return res.data;
  },

  async getAllUserIds() {
    const res = await api.get('/api/bot/user-ids');
    return res.data;
  },

  async getCatalog() {
    const res = await api.get('/api/bot/catalog');
    return res.data;
  },

  async getFreeTest(telegramId) {
    const res = await api.post(`/api/bot/freetest/${telegramId}`);
    return res.data;
  },

  async getUserServices(telegramId) {
    const res = await api.get(`/api/bot/user/${telegramId}/services`);
    return res.data;
  },

  async createOrder(payload) {
    const res = await api.post('/createOrder', payload);
    return res.data;
  },

  async approveOrder(orderId) {
    const res = await api.post(`/api/admin/orders/${orderId}/approve`);
    return res.data;
  },

  async rejectOrder(orderId) {
    const res = await api.post(`/api/admin/orders/${orderId}/reject`);
    return res.data;
  },

  async createTicket(userId, message) {
    const res = await api.post('/api/bot/ticket', { userId, message });
    return res.data;
  },

  async transferWallet(senderId, receiverId, amount) {
    const res = await api.post('/api/bot/wallet/transfer', { senderId, receiverId, amount });
    return res.data;
  },

  async getApps() {
    const res = await api.get('/api/admin/apps');
    return res.data;
  },

  async getDashboard() {
    const res = await api.get('/api/admin/dashboard');
    return res.data;
  }
};
