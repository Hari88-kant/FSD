function resolveApiBase() {
  const raw = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
  if (raw.startsWith('http') && !raw.endsWith('/api')) {
    return `${raw}/api`;
  }
  return raw || '/api';
}

const API_BASE = resolveApiBase();

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('smart_eb_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({
    success: false,
    error: { code: 'NETWORK_ERROR', message: 'Unable to parse server response' }
  }));

  if (!response.ok || !payload.success) {
    const message = payload?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.code = payload?.error?.code || 'API_ERROR';
    error.status = response.status;
    throw error;
  }

  return payload.data;
}
