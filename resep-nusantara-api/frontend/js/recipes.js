// Logic halaman Resep: fetch, search, filter (kesulitan/daerah/kategori/waktu), detail modal.

(function () {
  const listEl = document.getElementById('recipe-list');
  const stateEl = document.getElementById('recipe-state');
  const searchInput = document.getElementById('search-input');
  const difficultyChips = document.getElementById('difficulty-chips');
  const regionSelect = document.getElementById('region-select');
  const categorySelect = document.getElementById('category-select');
  const timeMinInput = document.getElementById('time-min');
  const timeMaxInput = document.getElementById('time-max');
  const rangeValuesEl = document.getElementById('range-values');
  const rangeTrackFill = document.getElementById('range-track-fill');
  const resetBtn = document.getElementById('reset-filters');

  const modal = document.getElementById('recipe-modal');
  const modalContent = document.getElementById('modal-content');
  const modalClose = document.getElementById('modal-close');

  let allRecipes = [];
  let timeBounds = { min: 0, max: 180 };

  const filters = {
    search: '',
    difficulty: '',
    region: '',
    category: '',
    minTime: 0,
    maxTime: 180,
  };

  function showLoading() {
    listEl.innerHTML = '';
    stateEl.hidden = false;
    stateEl.innerHTML = '<div class="spinner"></div><p>Memuat resep...</p>';
  }

  function showError(message) {
    listEl.innerHTML = '';
    stateEl.hidden = false;
    stateEl.innerHTML = `<p>${message}</p>`;
  }

  function showEmpty() {
    stateEl.hidden = false;
    stateEl.innerHTML = '<p>Tidak ada resep yang cocok dengan filter/pencarian Anda.</p>';
  }

  function hideState() {
    stateEl.hidden = true;
    stateEl.innerHTML = '';
  }

  function populateSelectOptions(selectEl, values, placeholder) {
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    values.forEach((value) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      selectEl.appendChild(opt);
    });
  }

  function setupTimeBounds(recipes) {
    if (!recipes.length) return;
    const times = recipes.map((r) => r.cook_time_minutes).filter((t) => typeof t === 'number');
    timeBounds.min = Math.min(...times);
    timeBounds.max = Math.max(...times);

    timeMinInput.min = timeBounds.min;
    timeMinInput.max = timeBounds.max;
    timeMaxInput.min = timeBounds.min;
    timeMaxInput.max = timeBounds.max;
    timeMinInput.value = timeBounds.min;
    timeMaxInput.value = timeBounds.max;

    filters.minTime = timeBounds.min;
    filters.maxTime = timeBounds.max;

    updateRangeUi();
  }

  function updateRangeUi() {
    let minVal = Number(timeMinInput.value);
    let maxVal = Number(timeMaxInput.value);

    if (minVal > maxVal) {
      [minVal, maxVal] = [maxVal, minVal];
    }

    filters.minTime = minVal;
    filters.maxTime = maxVal;

    const span = timeBounds.max - timeBounds.min || 1;
    const leftPct = ((minVal - timeBounds.min) / span) * 100;
    const rightPct = ((maxVal - timeBounds.min) / span) * 100;

    rangeTrackFill.style.left = `${leftPct}%`;
    rangeTrackFill.style.width = `${rightPct - leftPct}%`;

    rangeValuesEl.textContent = `${minVal} - ${maxVal} menit`;
  }

  function applyFilters() {
    const searchTerm = filters.search.trim().toLowerCase();

    const filtered = allRecipes.filter((r) => {
      if (searchTerm && !r.name.toLowerCase().includes(searchTerm)) return false;
      if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
      if (filters.region && r.region !== filters.region) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (typeof r.cook_time_minutes === 'number') {
        if (r.cook_time_minutes < filters.minTime || r.cook_time_minutes > filters.maxTime) return false;
      }
      return true;
    });

    renderList(filtered);
  }

  function difficultyTagClass(difficulty) {
    const key = (difficulty || '').toLowerCase();
    if (key === 'mudah') return 'tag-difficulty-mudah';
    if (key === 'sedang') return 'tag-difficulty-sedang';
    if (key === 'sulit') return 'tag-difficulty-sulit';
    return '';
  }

  function renderList(recipes) {
    listEl.innerHTML = '';

    if (!recipes.length) {
      showEmpty();
      return;
    }
    hideState();

    recipes.forEach((recipe) => {
      const card = document.createElement('article');
      card.className = 'card recipe-card';
      card.innerHTML = `
        ${thumbMarkup(recipe.image_url, recipe.name, '🍲')}
        <h3 class="card-title">${recipe.name}</h3>
        <div class="card-meta-row">
          <span class="tag">${recipe.category}</span>
          <span class="tag tag-region">${recipe.region}</span>
          <span class="tag ${difficultyTagClass(recipe.difficulty)}">${recipe.difficulty}</span>
        </div>
        <div class="card-stats">
          <span>⏱ ${recipe.cook_time_minutes} menit</span>
          <span>🍽 ${recipe.servings} porsi</span>
        </div>
      `;
      card.addEventListener('click', () => openDetail(recipe.id));
      listEl.appendChild(card);
    });
  }

  async function openDetail(id) {
    modal.hidden = false;
    modalContent.innerHTML = '<div class="spinner"></div>';

    try {
      const result = await Api.getRecipe(id);
      const recipe = result.data;

      const ingredientsHtml = (recipe.ingredients || [])
        .map(
          (ing) => `
          <li>
            <span class="ing-thumb">${thumbMarkup(ing.ingredient_image_url, ing.ingredient_name, '🌿')}</span>
            <span class="ing-name">${ing.ingredient_name}</span>
            <span class="ing-qty">${ing.quantity} ${ing.unit || ing.default_unit || ''}${ing.notes ? ` · ${ing.notes}` : ''}</span>
          </li>`
        )
        .join('');

      modalContent.innerHTML = `
        ${thumbMarkup(recipe.image_url, recipe.name, '🍲').replace('card-thumb', 'card-thumb modal-thumb')}
        <h2 class="modal-title">${recipe.name}</h2>
        <div class="card-meta-row">
          <span class="tag">${recipe.category}</span>
          <span class="tag tag-region">${recipe.region}</span>
          <span class="tag ${difficultyTagClass(recipe.difficulty)}">${recipe.difficulty}</span>
        </div>
        <div class="card-stats">
          <span>⏱ ${recipe.cook_time_minutes} menit</span>
          <span>🍽 ${recipe.servings} porsi</span>
        </div>
        <p class="modal-desc">${recipe.description || 'Tidak ada deskripsi.'}</p>
        <h3 class="modal-ingredients-title">Bahan-bahan</h3>
        <ul class="ingredient-list">${ingredientsHtml || '<li>Belum ada data bahan.</li>'}</ul>
      `;
    } catch (err) {
      modalContent.innerHTML = `<p>${err.message || 'Gagal memuat detail resep.'}</p>`;
    }
  }

  function closeModal() {
    modal.hidden = true;
    modalContent.innerHTML = '';
  }

  async function init() {
    showLoading();
    try {
      const result = await Api.listRecipes({ limit: 100 });
      allRecipes = result.data;

      const regions = [...new Set(allRecipes.map((r) => r.region).filter(Boolean))].sort();
      const categories = [...new Set(allRecipes.map((r) => r.category).filter(Boolean))].sort();
      populateSelectOptions(regionSelect, regions, 'Semua Daerah');
      populateSelectOptions(categorySelect, categories, 'Semua Kategori');

      setupTimeBounds(allRecipes);
      renderList(allRecipes);
    } catch (err) {
      showError(err.message || 'Gagal memuat data resep.');
    }
  }

  searchInput.addEventListener('input', (e) => {
    filters.search = e.target.value;
    applyFilters();
  });

  difficultyChips.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    difficultyChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    btn.classList.add('active');
    filters.difficulty = btn.dataset.value;
    applyFilters();
  });

  regionSelect.addEventListener('change', (e) => {
    filters.region = e.target.value;
    applyFilters();
  });

  categorySelect.addEventListener('change', (e) => {
    filters.category = e.target.value;
    applyFilters();
  });

  timeMinInput.addEventListener('input', () => {
    updateRangeUi();
    applyFilters();
  });

  timeMaxInput.addEventListener('input', () => {
    updateRangeUi();
    applyFilters();
  });

  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    filters.search = '';
    filters.difficulty = '';
    filters.region = '';
    filters.category = '';

    difficultyChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    difficultyChips.querySelector('.chip[data-value=""]').classList.add('active');
    regionSelect.value = '';
    categorySelect.value = '';

    timeMinInput.value = timeBounds.min;
    timeMaxInput.value = timeBounds.max;
    updateRangeUi();

    applyFilters();
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  init();
})();
