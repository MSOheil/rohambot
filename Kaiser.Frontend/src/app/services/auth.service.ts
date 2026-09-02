import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getStoredUser(): any {
    try {
      const userStr = localStorage.getItem('kaiser_admin_user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);

      // Check 10-day token expiration
      if (user.expiresAt && Date.now() > user.expiresAt) {
        this.logout();
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  getSavedUsername(): string {
    return localStorage.getItem('kaiser_saved_username') || 'roham';
  }

  isLoggedIn(): boolean {
    const user = this.getStoredUser();
    return !!user?.token;
  }

  login(credentials: { username: string; password: string; rememberMe?: boolean }): Observable<any> {
    return this.http.post<any>('/api/auth/login', credentials).pipe(
      tap((res) => {
        if (res.success && res.token) {
          // Set 10-day expiration in milliseconds (10 * 24 * 60 * 60 * 1000)
          const tenDaysDurationMs = 10 * 24 * 60 * 60 * 1000;
          const userObj = {
            ...res,
            expiresAt: Date.now() + tenDaysDurationMs
          };

          localStorage.setItem('kaiser_admin_user', JSON.stringify(userObj));
          localStorage.setItem('kaiser_saved_username', credentials.username.trim());
          this.currentUserSubject.next(userObj);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('kaiser_admin_user');
    this.currentUserSubject.next(null);
  }
}
