// src/app/app.config.ts
import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  withXsrfConfiguration,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { provideNgxMask } from 'ngx-mask';
import { routes } from './app.routes';

// Import your custom interceptor
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // ✅ Configure HttpClient with CORS/Cookie support
    provideHttpClient(
      withInterceptorsFromDi(), // Enable dependency injection for interceptors
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),

    // ✅ Provide custom interceptor for adding credentials to all requests
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },

    provideNgxMask(),

    // ✅ JWT configuration
    { provide: JWT_OPTIONS, useValue: {} },
    JwtHelperService,
  ],
};
