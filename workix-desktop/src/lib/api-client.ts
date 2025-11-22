import { invoke } from '@tauri-apps/api/core';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class DesktopApiClient {
  private backendUrl = 'http://localhost:5000/api';

  async get<T>(endpoint: string): Promise<T> {
    return this.callApi<T>(endpoint, 'GET');
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.callApi<T>(endpoint, 'POST', data);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.callApi<T>(endpoint, 'PUT', data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.callApi<T>(endpoint, 'DELETE');
  }

  private async callApi<T>(
    endpoint: string,
    method: string,
    body?: any
  ): Promise<T> {
    try {
      const response = await invoke<ApiResponse<T>>('call_backend_api', {
        endpoint,
        method,
        body: body || null,
      });

      if (!response.success) {
        throw new Error(response.error || 'API call failed');
      }

      return response.data as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Convenience methods for common operations
  async getWorkOrders() {
    return this.get<any>('work-orders');
  }

  async getWorkOrder(id: string) {
    return this.get<any>(`work-orders/${id}`);
  }

  async updateWorkOrder(id: string, data: any) {
    return this.put<any>(`work-orders/${id}`, data);
  }

  async getUsers() {
    return this.get<any>('users');
  }

  async getAnalytics() {
    return this.get<any>('analytics/summary');
  }
}

export const apiClient = new DesktopApiClient();
