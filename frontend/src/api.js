const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function errorMessage(status, body) {
  if (status === 0) {
    return 'Unable to reach the server.';
  }
  if (body?.error === 'Invalid credentials') {
    return 'Invalid email or password.';
  }
  if (body?.error === 'Validation failed') {
    return 'Please check your details and try again.';
  }
  if (body?.error === 'Unauthorized') {
    return 'Unauthorized';
  }
  if (body?.error === 'Not found' || status === 404) {
    return 'Inquiry not found.';
  }
  if (status >= 500) {
    return 'Unable to reach the server.';
  }
  return 'Something went wrong. Please try again.';
}

export async function apiFetch(path, options = {}) {
  const { skipUnauthorizedHandler = false, headers, body, ...rest } = options;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server.');
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !skipUnauthorizedHandler) {
      onUnauthorized?.();
    }
    throw new ApiError(response.status, errorMessage(response.status, data));
  }

  return data;
}

export function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    skipUnauthorizedHandler: true,
  });
}

export function logout() {
  return apiFetch('/api/auth/logout', {
    method: 'POST',
    skipUnauthorizedHandler: true,
  });
}

export function me() {
  return apiFetch('/api/auth/me', { skipUnauthorizedHandler: true });
}

export function getHealth() {
  return apiFetch('/api/health', { skipUnauthorizedHandler: true });
}

export function listInquiries({ q, status } = {}) {
  const params = new URLSearchParams();
  if (typeof q === 'string' && q.trim()) {
    params.set('q', q.trim());
  }
  if (status) {
    params.set('status', status);
  }
  const query = params.toString();
  return apiFetch(`/api/inquiries${query ? `?${query}` : ''}`);
}

export function createInquiry({ customerName, customerContact, subject, description }) {
  return apiFetch('/api/inquiries', {
    method: 'POST',
    body: {
      customerName,
      customerContact,
      subject,
      description,
    },
  });
}

export function getInquiry(id) {
  return apiFetch(`/api/inquiries/${id}`);
}

export function updateInquiryStatus(id, status) {
  return apiFetch(`/api/inquiries/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
