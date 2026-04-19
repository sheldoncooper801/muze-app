// ─── MUZE Auth Helpers ────────────────────────────────────────────────────────
// JWT is stored in React state via AuthContext (no localStorage/sessionStorage
// since those are blocked in the sandbox). For persistence across hard reloads,
// the token is kept in a module-level variable that survives SPA navigations.

let _token: string | null = null;

export function getToken(): string | null {
  return _token;
}

export function setToken(t: string | null) {
  _token = t;
}

export function clearToken() {
  _token = null;
}

export interface ArtistSession {
  id: number;
  name: string;
  email: string;
  phone: string;
  isVerified?: boolean;
}

export function getAuthHeaders(): Record<string, string> {
  if (_token) return { Authorization: `Bearer ${_token}` };
  return {};
}
