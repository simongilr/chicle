import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string) {
    return this.http.get<T>(this.url(path), { withCredentials: true });
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(this.url(path), body, { withCredentials: true });
  }

  put<T>(path: string, body: unknown) {
    return this.http.put<T>(this.url(path), body, { withCredentials: true });
  }

  patch<T>(path: string, body: unknown) {
    return this.http.patch<T>(this.url(path), body, { withCredentials: true });
  }

  delete<T>(path: string) {
    return this.http.delete<T>(this.url(path), { withCredentials: true });
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }
}
