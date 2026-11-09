const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export async function apiRequest(path, { token, method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    signal,
  });

  if (response.status === 204) return {};
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof payload === 'object' && payload?.message
        ? payload.message
        : `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.details = typeof payload === 'object' ? payload?.errors : undefined;
    if (response.status >= 500 && !contentType.includes('application/json')) {
      error.code = 'API_UNAVAILABLE';
    }
    throw error;
  }

  return payload?.data ?? payload;
}

export async function downloadResource(resource, token) {
  const response = await fetch(`${API_BASE}/resources/${resource._id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let message = `Download failed with status ${response.status}`;
    const contentType = response.headers.get('content-type') || '';
    try {
      const payload = await response.json();
      message = payload.message || message;
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    const error = new Error(message);
    error.status = response.status;
    if (response.status >= 500 && !contentType.includes('application/json')) {
      error.code = 'API_UNAVAILABLE';
    }
    throw error;
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const disposition = response.headers.get('content-disposition') || '';
  const filename = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];
  link.href = objectUrl;
  link.download = filename ? decodeURIComponent(filename.replace(/"/g, '')) : resource.originalFileName || 'resource';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
