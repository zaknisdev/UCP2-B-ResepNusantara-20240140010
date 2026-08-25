// Logic halaman login/register: toggle mode -> submit -> (login/daftar) -> pastikan API key -> redirect dashboard.

(function () {
  if (Session.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const toggle = document.getElementById('auth-toggle');
  const subtitle = document.getElementById('auth-subtitle');
  const nameGroup = document.getElementById('name-group');
  const nameInput = document.getElementById('login-name');
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  let mode = 'login';

  const SUBTITLES = {
    login: 'Masuk ke dashboard untuk mengelola akses API',
    register: 'Buat akun baru untuk mulai menggunakan API',
  };
  const SUBMIT_LABELS = {
    login: 'Login',
    register: 'Daftar',
  };

  function setMode(newMode) {
    mode = newMode;
    toggle.querySelectorAll('.auth-toggle-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    nameGroup.hidden = mode !== 'register';
    nameInput.required = mode === 'register';
    subtitle.textContent = SUBTITLES[mode];
    submitBtn.textContent = SUBMIT_LABELS[mode];
    clearError();
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  async function ensureApiKey() {
    const existing = await Api.listApiKeys();
    const activeKey = (existing.data || []).find((k) => k.is_active);
    if (activeKey) {
      return activeKey.key_value;
    }
    const created = await Api.createApiKey('Frontend Dashboard');
    return created.data.key_value;
  }

  async function loginAndRedirect(email, password) {
    const loginResult = await Api.login(email, password);
    Session.setToken(loginResult.data.token);
    Session.setUserName(loginResult.data.user.name);

    const apiKeyValue = await ensureApiKey();
    Session.setApiKey(apiKeyValue);

    window.location.href = 'dashboard.html';
  }

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.auth-toggle-btn');
    if (!btn) return;
    setMode(btn.dataset.mode);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const name = nameInput.value.trim();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (mode === 'register' && !name) {
      showError('Nama wajib diisi.');
      return;
    }
    if (!email || !password) {
      showError('Email dan password wajib diisi.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'register' ? 'Mendaftarkan...' : 'Memproses...';

    try {
      if (mode === 'register') {
        await Api.register(name, email, password);
      }
      await loginAndRedirect(email, password);
    } catch (err) {
      Session.clear();
      showError(err.message || (mode === 'register' ? 'Registrasi gagal. Silakan coba lagi.' : 'Login gagal. Silakan coba lagi.'));
      submitBtn.disabled = false;
      submitBtn.textContent = SUBMIT_LABELS[mode];
    }
  });

  setMode('login');
})();
