export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class DesktopApiClient {
  private backendUrl = 'http://localhost:5000/api/v1';

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Get token from Zustand persist storage
    try {
      const authData = localStorage.getItem('workix-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.token || null;
      }
    } catch (e) {
      console.error('Error reading auth token:', e);
    }
    return null;
  }

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
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method,
        headers,
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.backendUrl}/${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonResponse = await response.json();

      if (!jsonResponse.success) {
        throw new Error(jsonResponse.message || jsonResponse.error || 'API call failed');
      }

      return jsonResponse.data as T;
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
    return this.get<any>('analytics/dashboard');
  }
}

export const apiClient = new DesktopApiClient();
