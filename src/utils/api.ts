/**
 * API URL helper.
 * Leave VITE_API_BASE_URL empty for the normal same-origin Express deployment.
 * Set it to the deployed Express backend origin when a frontend-only preview
 * (such as a shared AI Studio preview) needs to reach a separate backend.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}

export async function readApiJson<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      `API endpoint returned ${contentType.includes('text/html') ? 'an HTML page' : 'a non-JSON response'} instead of JSON. ` +
      `Check that the Express backend is running and VITE_API_BASE_URL points to it.`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('The API returned invalid JSON. Check the backend deployment and API URL.');
  }
}
