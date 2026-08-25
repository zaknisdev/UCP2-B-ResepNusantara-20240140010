// Helper fetch ke backend Resep Nusantara API.
// Frontend di-serve dari origin yang sama dengan API (lihat src/app.js),
// jadi base URL cukup relatif kosong -> otomatis ikut origin saat ini
// baik saat dev lokal (localhost:3000) maupun setelah deploy ke Vercel.
const API_BASE_URL = '';

const SESSION_KEYS = {
  token: 'rn_token',
  apiKey: 'rn_api_key',
  userName: 'rn_user_name',
};

const Session = {
  getToken() {
    return sessionStorage.getItem(SESSION_KEYS.token);
  },
  setToken(token) {
    sessionStorage.setItem(SESSION_KEYS.token, token);
  },
  getApiKey() {
    return sessionStorage.getItem(SESSION_KEYS.apiKey);
  },
  setApiKey(apiKey) {
    sessionStorage.setItem(SESSION_KEYS.apiKey, apiKey);
  },
  getUserName() {
    return sessionStorage.getItem(SESSION_KEYS.userName);
  },
  setUserName(name) {
    sessionStorage.setItem(SESSION_KEYS.userName, name);
  },
  clear() {
    sessionStorage.removeItem(SESSION_KEYS.token);
    sessionStorage.removeItem(SESSION_KEYS.apiKey);
    sessionStorage.removeItem(SESSION_KEYS.userName);
  },
  isAuthenticated() {
    return Boolean(this.getToken() && this.getApiKey());
  },
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function apiRequest(path, { method = 'GET', body, auth = false, apiKey = false } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = Session.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (apiKey) {
    const key = Session.getApiKey();
    if (key) headers['x-api-key'] = key;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError('Tidak bisa terhubung ke server. Periksa koneksi Anda.', 0);
  }

  let json = null;
  try {
    json = await response.json();
  } catch (parseErr) {
    // response tanpa body / bukan JSON
  }

  if (!response.ok || !json || json.success === false) {
    const message = (json && json.message) || `Terjadi kesalahan (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return json;
}

// Markup thumbnail bergambar dengan fallback emoji kalau image_url kosong
// atau gagal dimuat (mis. link Unsplash yang belum pernah diisi).
function thumbMarkup(imageUrl, alt, fallbackEmoji) {
  if (!imageUrl) {
    return `<div class="card-thumb card-thumb-fallback">${fallbackEmoji}</div>`;
  }
  const safeAlt = String(alt).replace(/"/g, '&quot;');
  return `<div class="card-thumb"><img src="${imageUrl}" alt="${safeAlt}" loading="lazy" onerror="this.closest('.card-thumb').outerHTML='<div class=\\'card-thumb card-thumb-fallback\\'>${fallbackEmoji}</div>'" /></div>`;
}

const Api = {
  register(name, email, password) {
    return apiRequest('/auth/register', { method: 'POST', body: { name, email, password } });
  },
  login(email, password) {
    return apiRequest('/auth/login', { method: 'POST', body: { email, password } });
  },
  listApiKeys() {
    return apiRequest('/dashboard/api-keys', { method: 'GET', auth: true });
  },
  createApiKey(name) {
    return apiRequest('/dashboard/api-keys', { method: 'POST', auth: true, body: { name } });
  },
  listRecipes(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.region) query.set('region', params.region);
    if (params.difficulty) query.set('difficulty', params.difficulty);
    query.set('page', params.page || 1);
    query.set('limit', params.limit || 100);
    return apiRequest(`/api/v1/recipes?${query.toString()}`, { method: 'GET', apiKey: true });
  },
  getRecipe(id) {
    return apiRequest(`/api/v1/recipes/${id}`, { method: 'GET', apiKey: true });
  },
  listIngredients(params = {}) {
    const query = new URLSearchParams();
    query.set('page', params.page || 1);
    query.set('limit', params.limit || 100);
    return apiRequest(`/api/v1/ingredients?${query.toString()}`, { method: 'GET', apiKey: true });
  },
};
