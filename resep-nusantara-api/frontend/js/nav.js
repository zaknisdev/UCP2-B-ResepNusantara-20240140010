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

    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (scrollTopBtn) {
      scrollTopBtn.hidden = false;

      const toggleVisibility = () => {
        scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
      };
      toggleVisibility();
      window.addEventListener('scroll', toggleVisibility);

      scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
