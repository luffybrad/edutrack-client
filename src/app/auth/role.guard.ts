// src/app/auth/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, catchError, of } from 'rxjs';

export const RoleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const expectedRoles = route.data?.['roles'] as string[] | undefined;

  return auth.getProfile().pipe(
    map((res) => {
      const profile = res?.data;
      if (
        !profile ||
        (expectedRoles && !expectedRoles.includes(profile.role))
      ) {
        return router.createUrlTree(['/dashboard/unauthorized']);
      }
      return true;
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
