const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  expiresIn: number;
}

export interface ApiError {
  success: false;
  error: string;
}

/**
 * Login user with email or username and password
 */
export async function login(identifier: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_username: identifier, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Login failed');
  }

  // Store token and user data on login
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Store expiry time for frontend checking
    // expireIn comes from backend in seconds (e.g., 28800 for 8 hours)
    const expiryTime = Date.now() + data.expiresIn * 1000;
    localStorage.setItem('tokenExpiry', expiryTime.toString());
  }


  return data;
}

/**
 * Logout user - remove token and user data
 * redirect to login parameter
 * This also removes tokenExpiry from localStorage, so the app will know the user is logged out
 */
export function logout(redirectToLogin: boolean = true): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');

    if (redirectToLogin) {
      window.location.href = '/login';
    }
  }
}

/**
 * Get stored token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Get stored user data
 */
export function getUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}


/**
 * Check if token is expired based on stored expiry time
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;

  const tokenExpiry = localStorage.getItem('tokenExpiry');

  if (!tokenExpiry) return true;
  
  //Check if current time is past the expiry time
  return Date.now() > parseInt(tokenExpiry);
}


/**
 * Check if user is logged in
 * Plus added expiry check to ensure token is still valid
 */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token') && !isTokenExpired();
}


/**
 * Wrapper for fetch that handles 401 auto logout
 * fetchWithAuth() automatically logs the user out and redirects to login whenever their token expires or the backend returns a 401 unauthorized error.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Making sure token is checked before making request
  if (isTokenExpired()) {
    console.log('Token expired, logging out');
    logout(true);
    return Promise.reject(new Error('Session expired. Please log in again.'));
  }

  const token = getToken();

  // Build headers - only set Content-Type if not already provided
  const headers: Record<string, string> = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Only add Content-Type if body exists and header not already set
  if (options.body && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // If we get a 401 response, it means the token is invalid or expired, so simply we kick the user out and redirect to login
  if (response.status === 401) {
    console.log('Received 401 from HQ, logging out...');
    logout(true);
    throw new Error('Unauthorized. Please log in again.');
  }

  return response;
}