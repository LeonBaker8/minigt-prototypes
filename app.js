const sourceUrl = "assets/data/models.json";
const specialCollectionOrder = [
  "Bond 007 Collection",
  "Fast & Furious Collection",
  "Korean Collection",
];

const state = {
  models: [],
  filter: { kind: "all", value: "all" },
  search: "",
  lightbox: { photos: [], index: 0, modelName: "" },
};

const elements = {
  sidebar: document.querySelector("#sidebar"),
  sidebarNav: document.querySelector("#sidebarNav"),
  quickFilters: document.querySelector("#quickFilters"),
  title: document.querySelector("#catalogueTitle"),
  eyebrow: document.querySelector("#selectionEyebrow"),
  count: document.querySelector("#resultCount"),
  activeFilterLine: document.querySelector("#activeFilterLine"),
  modelGrid: document.querySelector("#modelGrid"),
  emptyState: document.querySelector("#emptyState"),
  search: document.querySelector("#searchInput"),
  backdrop: document.querySelector("#backdrop"),
  openFilters: document.querySelector("#openFilters"),
  closeFilters: document.querySelector("#closeFilters"),
  clearFilters: document.querySelector("#clearFilters"),
  lightbox: document.querySelector("#lightbox"),
  lightboxImage: document.querySelector("#lightboxImage"),
  lightboxCaption: document.querySelector("#lightboxCaption"),
  closeLightbox: document.querySelector("#closeLightbox"),
  previousPhoto: document.querySelector("#previousPhoto"),
  nextPhoto: document.querySelector("#nextPhoto"),
  missingPhoto: document.querySelector("#photoMissingTemplate"),
};

const eventIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.5a7.5 7.5 0 0 0-7.5 7.5c0 5.6 7.5 11.5 7.5 11.5s7.5-5.9 7.5-11.5A7.5 7.5 0 0 0 12 2.5Zm0 10.3a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z" />
  </svg>`;

function countBy(items, valueGetter) {
  return items.reduce((counts, item) => {
    const value = valueGetter(item);
    counts.set(value, (counts.get(value) || 0) + 1);
    return counts;
  }, new Map());
}

function getBrands() {
  return [...countBy(state.models, (model) => model.brand).entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function getCollections() {
  const counts = new Map(specialCollectionOrder.map((name) => [name, 0]));
  state.models.forEach((model) => {
    model.collections.forEach((collection) => {
      counts.set(collection, (counts.get(collection) || 0) + 1);
    });
  });
  const ordered = specialCollectionOrder.map((name) => ({ name, count: counts.get(name) || 0 }));
  const extras = [...counts.entries()]
    .filter(([name]) => !specialCollectionOrder.includes(name))
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([name, count]) => ({ name, count }));
  return [...ordered, ...extras];
}

function isSelected(kind, value) {
  return state.filter.kind === kind && state.filter.value === value;
}

function filterLabel() {
  if (state.filter.kind === "all") return "Все модели";
  if (state.filter.kind === "status") return "Отменённые модели";
  return state.filter.value;
}

function cancelledCount() {
  return state.models.filter((model) => model.cancelled).length;
}

function getVisibleModels() {
  const query = state.search.trim().toLocaleLowerCase("ru");
  return state.models.filter((model) => {
    const matchesFilter =
      state.filter.kind === "all" ||
      (state.filter.kind === "brand" && model.brand === state.filter.value) ||
      (state.filter.kind === "collection" && model.collections.includes(state.filter.value)) ||
      (state.filter.kind === "status" && model.cancelled);
    if (!matchesFilter) return false;
    if (!query) return true;
    const searchable = [model.name, model.brand, model.event, model.date, ...model.collections]
      .join(" ")
      .toLocaleLowerCase("ru");
    return searchable.includes(query);
  });
}

function formatDate(date) {
  if (!date) return "Дата не указана";
  if (/^\d{4}$/.test(date)) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
      .format(new Date(`${date}T12:00:00`));
  }
  return date;
}

function photoRoleLabel(role) {
  return { model: "MINI GT", additional: "ДЕТАЛЬ", realCar: "REAL CAR" }[role] || "ФОТО";
}

function renderSidebar() {
  const createFilter = (kind, name, count) => `
    <button class="side-filter ${isSelected(kind, kind === "all" ? "all" : name) ? "is-active" : ""}"
      type="button" data-filter-kind="${kind}" data-filter-value="${kind === "all" ? "all" : escapeHtml(name)}">
      <span class="filter-label">${escapeHtml(name)}</span><span class="filter-count">${count}</span>
    </button>`;
  const collections = getCollections();
  const brands = getBrands();
  elements.sidebarNav.innerHTML = `
    <div class="filter-group">
      <p class="filter-group-title">Показать</p>
      ${createFilter("all", "Все модели", state.models.length)}
    </div>
    <div class="filter-group">
      <p class="filter-group-title">Статус</p>
      ${createFilter("status", "CANCELLED", cancelledCount())}
    </div>
    <div class="filter-group">
      <p class="filter-group-title">Коллекции</p>
      ${collections.map(({ name, count }) => createFilter("collection", name, count)).join("")}
    </div>
    <div class="filter-group">
      <p class="filter-group-title">Марки</p>
      ${brands.map(({ name, count }) => createFilter("brand", name, count)).join("")}
    </div>`;
}

function renderQuickFilters() {
  const all = [{ kind: "all", name: "Все модели", count: state.models.length }];
  const statuses = [{ kind: "status", name: "CANCELLED", count: cancelledCount() }];
  const collections = getCollections().map((item) => ({ ...item, kind: "collection" }));
  const brands = getBrands().map((item) => ({ ...item, kind: "brand" }));
  elements.quickFilters.innerHTML = [...all, ...statuses, ...collections, ...brands]
    .map(({ kind, name, count }) => {
      const value = kind === "all" ? "all" : name;
      const selected = isSelected(kind, value);
      return `<button class="quick-filter ${kind === "collection" ? "collection" : ""} ${kind === "status" ? "status" : ""} ${selected ? "is-active" : ""} ${count === 0 ? "disabled" : ""}"
        type="button" data-filter-kind="${kind}" data-filter-value="${escapeHtml(value)}">
        ${escapeHtml(name)}<span class="quick-count">${count}</span>
      </button>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function photoStage(model) {
  if (!model.photos.length) return elements.missingPhoto.innerHTML;
  const firstPhoto = model.photos[0];
  const controls = model.photos.length > 1
    ? `<div class="gallery-controls" aria-label="Фото модели">${model.photos.map((photo, index) => `
        <button class="gallery-dot ${index === 0 ? "is-active" : ""}" type="button"
          data-photo-index="${index}" aria-label="${escapeHtml(photo.label)} ${index + 1}">${index + 1}</button>`).join("")}</div>`
    : "";
  return `
    <div class="photo-stage" data-photo-stage>
      <img src="${escapeHtml(firstPhoto.src)}" alt="${escapeHtml(`${model.name} — ${firstPhoto.label}`)}" loading="lazy" data-open-lightbox="true" tabindex="0" />
      <span class="photo-tag" data-photo-label>${photoRoleLabel(firstPhoto.role)}</span>
      ${controls}
    </div>`;
}

function renderCards() {
  const models = getVisibleModels();
  const label = filterLabel();
  elements.title.textContent = label;
  elements.eyebrow.textContent = state.filter.kind === "collection" ? "COLLECTION / PROTOTYPES" : "MINI GT / PROTOTYPES";
  elements.count.textContent = `Показано: ${models.length} из ${state.models.length}`;
  elements.activeFilterLine.textContent = state.search
    ? `Результаты поиска «${state.search}» в разделе «${label}»`
    : `Выбранный раздел: ${label}`;
  elements.modelGrid.hidden = models.length === 0;
  elements.emptyState.hidden = models.length !== 0;
  elements.modelGrid.innerHTML = models.map((model) => `
    <article class="model-card" data-model-id="${escapeHtml(model.id)}">
      ${photoStage(model)}
      <div class="card-info">
        <div class="card-meta"><span>${escapeHtml(model.brand)}</span><span>${escapeHtml(formatDate(model.date))}</span></div>
        <h2 class="card-name">${escapeHtml(model.name)}</h2>
        <p class="card-event">${eventIcon}<span>${escapeHtml(model.event || "Выставка не указана")}</span></p>
        ${model.cancelled ? `<span class="cancelled-notice">CANCELLED</span>` : ""}
        ${model.collections.length ? `<div class="card-collections">${model.collections.map((collection) => `<span class="collection-tag">${escapeHtml(collection)}</span>`).join("")}</div>` : ""}
      </div>
    </article>`).join("");
}

function render() {
  renderSidebar();
  renderQuickFilters();
  renderCards();
}

function chooseFilter(kind, value) {
  state.filter = { kind, value };
  state.search = "";
  elements.search.value = "";
  render();
  closeFilters();
  window.location.hash = kind === "all" ? "all" : `${kind}/${encodeURIComponent(value)}`;
}

function closeFilters() {
  elements.sidebar.classList.remove("is-open");
  elements.backdrop.hidden = true;
}

function setCardPhoto(card, photoIndex) {
  const model = state.models.find((item) => item.id === card.dataset.modelId);
  if (!model || !model.photos[photoIndex]) return;
  const photo = model.photos[photoIndex];
  const image = card.querySelector(".photo-stage img");
  image.src = photo.src;
  image.alt = `${model.name} — ${photo.label}`;
  card.querySelector("[data-photo-label]").textContent = photoRoleLabel(photo.role);
  card.querySelectorAll(".gallery-dot").forEach((button, index) => button.classList.toggle("is-active", index === photoIndex));
}

function openLightbox(card) {
  const model = state.models.find((item) => item.id === card.dataset.modelId);
  if (!model || !model.photos.length) return;
  const activeIndex = [...card.querySelectorAll(".gallery-dot")].findIndex((dot) => dot.classList.contains("is-active"));
  state.lightbox = { photos: model.photos, index: Math.max(activeIndex, 0), modelName: model.name };
  updateLightbox();
  elements.lightbox.showModal();
}

function updateLightbox() {
  const photo = state.lightbox.photos[state.lightbox.index];
  if (!photo) return;
  elements.lightboxImage.src = photo.src;
  elements.lightboxImage.alt = `${state.lightbox.modelName} — ${photo.label}`;
  elements.lightboxCaption.textContent = `${state.lightbox.modelName} · ${photo.label} (${state.lightbox.index + 1}/${state.lightbox.photos.length})`;
  const hasMultiple = state.lightbox.photos.length > 1;
  elements.previousPhoto.hidden = !hasMultiple;
  elements.nextPhoto.hidden = !hasMultiple;
}

function moveLightboxPhoto(direction) {
  const total = state.lightbox.photos.length;
  if (total < 2) return;
  state.lightbox.index = (state.lightbox.index + direction + total) % total;
  updateLightbox();
}

function applyHash() {
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (!hash || hash === "all") return;
  const [kind, ...valueParts] = hash.split("/");
  const value = valueParts.join("/");
  if ((kind === "status" && value === "CANCELLED") ||
      (kind === "brand" && getBrands().some((item) => item.name === value)) ||
      (kind === "collection" && getCollections().some((item) => item.name === value))) {
    state.filter = { kind, value };
  }
}

document.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-filter-kind]");
  if (filterButton) chooseFilter(filterButton.dataset.filterKind, filterButton.dataset.filterValue);
  const galleryButton = event.target.closest(".gallery-dot");
  if (galleryButton) {
    event.stopPropagation();
    setCardPhoto(galleryButton.closest(".model-card"), Number(galleryButton.dataset.photoIndex));
  }
  if (event.target.closest("[data-open-lightbox]")) openLightbox(event.target.closest(".model-card"));
});

elements.search.addEventListener("input", (event) => { state.search = event.target.value; renderCards(); });
elements.openFilters.addEventListener("click", () => { elements.sidebar.classList.add("is-open"); elements.backdrop.hidden = false; });
elements.closeFilters.addEventListener("click", closeFilters);
elements.backdrop.addEventListener("click", closeFilters);
elements.clearFilters.addEventListener("click", () => chooseFilter("all", "all"));
elements.closeLightbox.addEventListener("click", () => elements.lightbox.close());
elements.previousPhoto.addEventListener("click", () => moveLightboxPhoto(-1));
elements.nextPhoto.addEventListener("click", () => moveLightboxPhoto(1));
elements.lightbox.addEventListener("click", (event) => { if (event.target === elements.lightbox) elements.lightbox.close(); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeFilters();
  if (!elements.lightbox.open) return;
  if (event.key === "ArrowLeft") moveLightboxPhoto(-1);
  if (event.key === "ArrowRight") moveLightboxPhoto(1);
});

fetch(sourceUrl)
  .then((response) => {
    if (!response.ok) {
      const message = response.status === 404
        ? "В публикации отсутствует папка assets. Загрузите проект целиком, включая assets/data и assets/images."
        : "Не удалось загрузить каталог.";
      throw new Error(message);
    }
    return response.json();
  })
  .then((models) => {
    state.models = models;
    applyHash();
    render();
  })
  .catch((error) => {
    elements.modelGrid.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    console.error(error);
  });
