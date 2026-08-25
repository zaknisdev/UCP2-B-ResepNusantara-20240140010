// Guard sesi + wiring navbar (logout, nama user) untuk semua halaman selain login.

(function () {
  if (!Session.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Session.clear();
        window.location.href = 'login.html';
      });
    }

    const userNameEl = document.getElementById('nav-user-name');
    if (userNameEl) {
      userNameEl.textContent = Session.getUserName() || '';
    }
  });
})();
