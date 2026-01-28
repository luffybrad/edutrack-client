// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { provideNgxMask } from 'ngx-mask';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // ✅ Simplified HttpClient with JWT interceptor only
    provideHttpClient(withInterceptors([authInterceptor])),

    provideNgxMask(),

    // ✅ JWT configuration (optional - if you use @auth0/angular-jwt)
    { provide: JWT_OPTIONS, useValue: {} },
    JwtHelperService,
  ],
};
