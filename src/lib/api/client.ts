type ApiError = {
  message: string;
  code?: string;
  status?: number;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = {
      message: 'Error de servidor',
      status: response.status,
    };
    try {
      const data = await response.json();
      error.message = data.error || error.message;
      error.code = data.code;
    } catch {}
    throw error;
  }
  return response.json();
}

export async function apiGet<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, { ...options, credentials: 'include' });
    return handleResponse<T>(response);
  } catch (error: any) {
    console.error(`[API GET] ${url}`, error);
    throw error;
  }
}

export async function apiPost<T>(url: string, body?: any, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    return handleResponse<T>(response);
  } catch (error: any) {
    console.error(`[API POST] ${url}`, error);
    throw error;
  }
}

export async function apiPut<T>(url: string, body?: any, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    return handleResponse<T>(response);
  } catch (error: any) {
    console.error(`[API PUT] ${url}`, error);
    throw error;
  }
}

export async function apiDelete<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, { ...options, method: 'DELETE', credentials: 'include' });
    return handleResponse<T>(response);
  } catch (error: any) {
    console.error(`[API DELETE] ${url}`, error);
    throw error;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}
