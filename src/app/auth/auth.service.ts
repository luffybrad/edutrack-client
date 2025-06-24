import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthEndpoints, RoleType } from './auth.routes';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentRole: RoleType | null = null;
  private loggedIn$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {}

  login(role: RoleType, data: any) {
    this.currentRole = role;
    return this.http
      .post(AuthEndpoints.login[role], data, {
        withCredentials: true,
      })
      .pipe(tap(() => this.loggedIn$.next(true)));
  }

  signup(role: RoleType, data: any) {
    return this.http.post(AuthEndpoints.signup[role], data, {
      withCredentials: true,
    });
  }

  forgotPassword(email: string, role: RoleType) {
    return this.http.post(
      AuthEndpoints.forgotPassword,
      { email, role },
      { withCredentials: true }
    );
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(
      AuthEndpoints.resetPassword,
      { token, newPassword },
      { withCredentials: true }
    );
  }

  getProfile() {
    return this.http
      .get(AuthEndpoints.profile, {
        withCredentials: true,
      })
      .pipe(
        tap(() => this.loggedIn$.next(true)),
        catchError((err) => {
          this.loggedIn$.next(false);
          return of(null);
        })
      );
  }

  updateProfile(data: any) {
    return this.http.put(AuthEndpoints.profile, data, {
      withCredentials: true,
    });
  }

  logout() {
    this.http
      .post(
        AuthEndpoints.logout,
        {},
        {
          withCredentials: true,
        }
      )
      .subscribe({
        next: () => {
          this.currentRole = null;
          this.loggedIn$.next(false);
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Logout failed:', err);
          this.router.navigate(['/login']);
        },
      });
  }

  setRole(role: RoleType) {
    this.currentRole = role;
  }

  getRole(): RoleType | null {
    return this.currentRole;
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }
}
