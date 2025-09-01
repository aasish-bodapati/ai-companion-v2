import api from '@/lib/api';

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface AccountDeletionRequest {
  password: string;
}

export interface PasswordChangeResponse {
  message: string;
}

export interface AccountDeletionResponse {
  message: string;
}

/**
 * Change user password
 */
export async function changePassword(data: PasswordChangeRequest): Promise<PasswordChangeResponse> {
  return api.put<PasswordChangeResponse>('/users/me/password', data);
}

/**
 * Delete user account
 */
export async function deleteAccount(data: AccountDeletionRequest): Promise<AccountDeletionResponse> {
  // Use the same base URL logic as the api client to avoid duplication
  const rawBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const apiPrefix = '/api/v1';
  const baseUrl = rawBase.endsWith(apiPrefix) ? rawBase : `${rawBase}${apiPrefix}`;
  const apiUrl = `${baseUrl}/users/me`;
  
  const response = await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete account');
  }
  
  return response.json();
}
