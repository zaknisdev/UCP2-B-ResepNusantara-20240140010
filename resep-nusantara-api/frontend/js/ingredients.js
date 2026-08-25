// Logic halaman Bumbu: fetch daftar bahan + search real-time.

(function () {
  const listEl = document.getElementById('ingredient-list');
  const stateEl = document.getElementById('ingredient-state');
  const searchInput = document.getElementById('search-input');

  let allIngredients = [];

  function showLoading() {
    listEl.innerHTML = '';
    stateEl.hidden = false;
    stateEl.innerHTML = '<div class="spinner"></div><p>Memuat bumbu...</p>';
  }

  function showError(message) {
    listEl.innerHTML = '';
    stateEl.hidden = false;
    stateEl.innerHTML = `<p>${message}</p>`;
  }

  function showEmpty() {
    stateEl.hidden = false;
    stateEl.innerHTML = '<p>Tidak ada bahan yang cocok dengan pencarian Anda.</p>';
  }

  function hideState() {
    stateEl.hidden = true;
    stateEl.innerHTML = '';
  }

  function renderList(ingredients) {
    listEl.innerHTML = '';

    if (!ingredients.length) {
      showEmpty();
      return;
    }
    hideState();

    ingredients.forEach((ing) => {
      const card = document.createElement('article');
      card.className = 'card ingredient-card';
      card.innerHTML = `
        ${thumbMarkup(ing.image_url, ing.name, '🌿')}
        <h3 class="card-title">${ing.name}</h3>
        <span class="ingredient-unit">Satuan default: ${ing.default_unit || '-'}</span>
      `;
      listEl.appendChild(card);
    });
  }

  function applyFilter() {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = term
      ? allIngredients.filter((i) => i.name.toLowerCase().includes(term))
      : allIngredients;
    renderList(filtered);
  }

  async function init() {
    showLoading();
    try {
      const result = await Api.listIngredients({ limit: 100 });
      allIngredients = result.data;
      renderList(allIngredients);
    } catch (err) {
      showError(err.message || 'Gagal memuat data bumbu.');
    }
  }

  searchInput.addEventListener('input', applyFilter);

  init();
})();
