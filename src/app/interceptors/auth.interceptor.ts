// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private router = inject(Router);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // Clone request and add withCredentials
    const cloned = req.clone({
      withCredentials: true, // This sends cookies automatically
    });

    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors (token expired)
        if (error.status === 401) {
          // Clear any local storage
          localStorage.removeItem('user');
          localStorage.removeItem('token');

          // Redirect to login
          this.router.navigate(['/login']);
        }

        // Handle CORS errors
        if (error.status === 0) {
          console.error('CORS error or network issue:', error);
        }

        return throwError(() => error);
      }),
    );
  }
}
