// src/app/auth/auth.routes.ts
export enum RoleType {
  Admin = 'admin',
  Guardian = 'guardian',
  Teacher = 'teacher',
}

const BASE = 'http://localhost:3000/api/auth';

export const AuthEndpoints = {
  login: {
    [RoleType.Admin]: `${BASE}/login/admin`,
    [RoleType.Guardian]: `${BASE}/login/guardian`,
    [RoleType.Teacher]: `${BASE}/login/teacher`,
  },
  signup: {
    [RoleType.Admin]: `${BASE}/signup/admin`,
    [RoleType.Guardian]: `${BASE}/signup/guardian`,
    [RoleType.Teacher]: `${BASE}/signup/teacher`,
  },
  forgotPassword: `${BASE}/forgot-password`,
  resetPassword: `${BASE}/reset-password`,
  profile: `${BASE}/profile`,
  logout: `${BASE}/logout`,
};
