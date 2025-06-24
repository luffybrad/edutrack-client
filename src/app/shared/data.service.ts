// src/app/shared/data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export function createDataService(http: HttpClient) {
  const baseUrl = environment.apiUrl;

  return {
    getClasses: () => http.get<any[]>(`${baseUrl}/classes`),
    getStudents: () => http.get<any[]>(`${baseUrl}/students`),
  };
}
