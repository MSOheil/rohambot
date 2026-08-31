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
    const user = localStorage.getItem('kaiser_admin_user');
    return user ? JSON.parse(user) : null;
  }

  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue?.token;
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>('/api/auth/login', credentials).pipe(
      tap((res) => {
        if (res.success && res.token) {
          localStorage.setItem('kaiser_admin_user', JSON.stringify(res));
          this.currentUserSubject.next(res);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('kaiser_admin_user');
    this.currentUserSubject.next(null);
  }
}
