import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`);
  }

  // Servers
  getServers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/servers`);
  }

  createServer(server: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/servers`, server);
  }

  updateServer(id: number, server: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/servers/${id}`, server);
  }

  deleteServer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/servers/${id}`);
  }

  pingServer(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/servers/${id}/ping`, {});
  }

  // Categories & Plans
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`);
  }

  createCategory(cat: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/categories`, cat);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/categories/${id}`);
  }

  getPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/plans`);
  }

  createPlan(plan: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/plans`, plan);
  }

  deletePlan(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/plans/${id}`);
  }

  // Services / Subscriptions
  getServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/services`);
  }

  toggleService(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/services/${id}/toggle`, {});
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/services/${id}`);
  }

  getSubscriptionState(token: string): Observable<any> {
    return this.http.get<any>(`/state/${token}`);
  }

  // Users
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`);
  }

  updateWallet(userId: number, amount: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/wallet`, { userId, amount });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/users/${id}`);
  }

  // Orders
  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/orders`);
  }

  approveOrder(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders/${id}/approve`, {});
  }

  rejectOrder(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders/${id}/reject`, {});
  }

  // Discounts
  getDiscounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/discounts`);
  }

  createDiscount(discount: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/discounts`, discount);
  }

  // Tickets
  getTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tickets`);
  }

  replyTicket(ticketId: number, replyText: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tickets/reply`, { ticketId, replyText });
  }

  // Apps
  getApps(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/apps`);
  }

  createApp(app: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/apps`, app);
  }

  // Settings
  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/settings`);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/settings`, settings);
  }

  // Broadcast
  broadcastMessage(payload: { message: string; targetUserIds?: number[]; sendToAll: boolean }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/broadcast`, payload);
  }
}
