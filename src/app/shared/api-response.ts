// src/app/shared/api-response.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
