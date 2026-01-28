// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthEndpoints, RoleType } from './auth.routes';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response';

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string; // ✅ JWT token in response
    user: any;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentRole: RoleType | null = null;
  private loggedIn$ = new BehaviorSubject<boolean>(false);
  private profile$ = new BehaviorSubject<any>(null);
  private tokenKey = 'auth_token'; // ✅ Token storage key

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.restoreFromStorage();
  }

  // ✅ Store token and profile
  private persistSession(token: string, profile: any) {
    this.currentRole = profile.role;
    localStorage.setItem(this.tokenKey, token); // ✅ Store JWT token
    localStorage.setItem('user_role', profile.role);
    localStorage.setItem('user_profile', JSON.stringify(profile));
    this.profile$.next(profile);
    this.loggedIn$.next(true);
  }

  // ✅ Load from localStorage
  private restoreFromStorage() {
    const token = localStorage.getItem(this.tokenKey);
    const role = localStorage.getItem('user_role') as RoleType;
    const profile = localStorage.getItem('user_profile');

    if (token && role) {
      this.currentRole = role;
      if (profile) this.profile$.next(JSON.parse(profile));
      this.loggedIn$.next(true);
    }
  }

  // ✅ Clear everything on logout
  private clearSession() {
    this.currentRole = null;
    this.loggedIn$.next(false);
    this.profile$.next(null);
    localStorage.removeItem(this.tokenKey); // ✅ Remove token
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_profile');
  }

  // ✅ Login - Store token from response
  login(role: RoleType, data: any): Observable<LoginResponse> {
    this.currentRole = role;
    return this.http.post<LoginResponse>(AuthEndpoints.login[role], data).pipe(
      tap((response) => {
        if (response.success && response.data.token) {
          this.persistSession(response.data.token, response.data.user);
        }
      }),
    );
  }

  signup(role: RoleType, data: any) {
    return this.http.post(AuthEndpoints.signup[role], data);
  }

  forgotPassword(email: string, role: RoleType) {
    return this.http.post(AuthEndpoints.forgotPassword, { email, role });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(AuthEndpoints.resetPassword, { token, newPassword });
  }

  getProfile() {
    return this.http
      .get<{
        success: boolean;
        data: {
          id: string;
          name: string;
          email: string;
          phone: string;
          role: RoleType;
        };
      }>(AuthEndpoints.profile)
      .pipe(
        tap((res) => {
          const profile = res?.data;
          this.loggedIn$.next(true);
          this.currentRole = profile?.role ?? null;
        }),
        catchError((err) => {
          this.loggedIn$.next(false);
          return of(null);
        }),
      );
  }

  updateProfile(data: any) {
    return this.http.put(AuthEndpoints.profile, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.http.post<ApiResponse<null>>(
      AuthEndpoints.changePassword,
      data,
    );
  }

  // ✅ Logout - No withCredentials needed
  logout() {
    this.http.post(AuthEndpoints.logout, {}).subscribe({
      next: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      },
    });
  }

  // ✅ Get token for interceptor
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setRole(role: RoleType) {
    this.currentRole = role;
    localStorage.setItem('user_role', role);
  }

  getRole(): RoleType | null {
    return this.currentRole || (localStorage.getItem('user_role') as RoleType);
  }

  getProfileSync() {
    return this.profile$.value;
  }

  getProfile$(): Observable<any> {
    return this.profile$.asObservable();
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  // ✅ Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
