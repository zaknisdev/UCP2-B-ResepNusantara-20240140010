// Logic halaman login: submit -> login JWT -> pastikan API key tersedia -> redirect dashboard.

(function () {
  if (Session.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showError('Email dan password wajib diisi.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Memproses...';

    try {
      const loginResult = await Api.login(email, password);
      Session.setToken(loginResult.data.token);
      Session.setUserName(loginResult.data.user.name);

      const apiKeyValue = await ensureApiKey();
      Session.setApiKey(apiKeyValue);

      window.location.href = 'dashboard.html';
    } catch (err) {
      Session.clear();
      showError(err.message || 'Login gagal. Silakan coba lagi.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
})();
