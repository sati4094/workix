export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Request cancellation registry for cleanup on unmount
const abortControllers = new Map<string, AbortController>();

export function cancelRequest(requestId: string): void {
  const controller = abortControllers.get(requestId);
  if (controller) {
    controller.abort();
    abortControllers.delete(requestId);
  }
}

export function cancelAllRequests(): void {
  abortControllers.forEach((controller) => controller.abort());
  abortControllers.clear();
}

export class DesktopApiClient {
  private backendUrl = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` : 'http://localhost:5000/api/v1';
  private rateLimitRetryAfter = 0;

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
      // Silent fail for token read errors
    }
    return null;
  }

  async get<T>(endpoint: string, requestId?: string): Promise<T> {
    return this.callApi<T>(endpoint, 'GET', undefined, requestId);
  }

  async post<T>(endpoint: string, data: any, requestId?: string): Promise<T> {
    return this.callApi<T>(endpoint, 'POST', data, requestId);
  }

  async put<T>(endpoint: string, data: any, requestId?: string): Promise<T> {
    return this.callApi<T>(endpoint, 'PUT', data, requestId);
  }

  async delete<T>(endpoint: string, requestId?: string): Promise<T> {
    return this.callApi<T>(endpoint, 'DELETE', undefined, requestId);
  }

  private async callApi<T>(
    endpoint: string,
    method: string,
    body?: any,
    requestId?: string
  ): Promise<T> {
    // Check rate limit
    if (this.rateLimitRetryAfter > Date.now()) {
      const waitTime = Math.ceil((this.rateLimitRetryAfter - Date.now()) / 1000);
      throw new Error(`Rate limited. Please retry after ${waitTime} seconds.`);
    }

    // Setup abort controller for cancellation
    const controller = new AbortController();
    const finalRequestId = requestId || `${method}-${endpoint}-${Date.now()}`;
    abortControllers.set(finalRequestId, controller);

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
        signal: controller.signal,
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.backendUrl}/${endpoint}`, config);

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        this.rateLimitRetryAfter = Date.now() + retryMs;
        throw new Error(`Rate limited. Please retry after ${Math.ceil(retryMs / 1000)} seconds.`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonResponse = await response.json();

      if (!jsonResponse.success) {
        throw new Error(jsonResponse.message || jsonResponse.error || 'API call failed');
      }

      return jsonResponse.data as T;
    } catch (error: any) {
      // Don't log abort errors - they're expected during cleanup
      if (error.name !== 'AbortError') {
        // Silently handle errors - let caller deal with them
      }
      throw error;
    } finally {
      abortControllers.delete(finalRequestId);
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
