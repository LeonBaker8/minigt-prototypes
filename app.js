const sourceUrl = "assets/data/models.json";
const specialCollectionOrder = ["Bond 007 Collection", "Fast & Furious Collection"];
const lastCollectionOrder = ["Korean Collection", "Motorbike Collection", "Qube Carz Collection"];
const catalogMeta = window.MINI_GT_CATALOG_META || {};

const visualAssets = {
  brands: {
    "ALFA ROMEO": "assets/brands/alfa-romeo.svg",
    "AMC": "assets/brands/amc.svg",
    "FERRARI": "assets/brands/ferrari.png",
    "BMW": "assets/brands/bmw.png",
    "BENTLEY": "assets/brands/bentley.svg",
    "BUGATTI": "assets/brands/bugatti.png",
    "CADILLAC": "assets/brands/cadillac-emblem.svg",
    "CHEVROLET": "assets/brands/chevrolet-emblem.svg",
    "CITROEN": "assets/brands/citroen-emblem.svg",
    "DATSUN": "assets/brands/datsun.svg",
    "DODGE": "assets/brands/dodge-fratzog.svg",
    "FIAT": "assets/brands/fiat.png",
    "FORD": "assets/brands/ford.png",
    "HARLEY DAVIDSON": "assets/brands/harley-davidson.svg",
    "HONDA": "assets/brands/honda-emblem.svg",
    "HYUNDAI": "assets/brands/hyundai-emblem.svg",
    "JAGUAR": "assets/brands/jaguar-emblem.svg",
    "LAMBORGHINI": "assets/brands/lamborghini.png",
    "LAND ROVER": "assets/brands/land-rover.png",
    "LEXUS": "assets/brands/lexus-emblem.svg",
    "LINCOLN": "assets/brands/lincoln.svg",
    "LOTUS": "assets/brands/lotus.png",
    "MAZDA": "assets/brands/mazda-emblem.svg",
    "MCLAREN": "assets/brands/mclaren.svg",
    "MERCEDES": "assets/brands/mercedes.svg",
    "MINI": "assets/brands/mini.svg",
    "MITSUBISHI": "assets/brands/mitsubishi.svg",
    "NISSAN": "assets/brands/nissan.svg",
    "Piaggio": "assets/brands/piaggio.svg",
    "PORSCHE": "assets/brands/porsche-crest.svg",
    "RACING BULLS": "assets/brands/racing-bulls.png",
    "RED BULL": "assets/brands/red-bull.svg",
    "SCANIA": "assets/brands/scania.svg",
    "TOYOTA": "assets/brands/toyota.svg",
    "VOLKSWAGEN": "assets/brands/volkswagen.svg",
    "WESTERN STAR": "assets/brands/western-star.svg",
    "ASTON MARTIN": "assets/brands/aston-martin.svg",
  },
  collections: {
    "Bond 007 Collection": "assets/collections/bond-007.svg",
    "Fast & Furious Collection": "assets/collections/fast-furious.png",
    "F1 Collection": "assets/collections/f1.svg",
    "IMSA Collection": "assets/collections/imsa.svg",
    "Korean Collection": "assets/collections/korean.svg",
    "Motorbike Collection": "assets/collections/motorbike.svg",
    "Qube Carz Collection": "assets/collections/qube-carz-inverted.png",
    "Senna Collection": "assets/collections/senna.png",
  },
};


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
  selectionImage: document.querySelector("#selectionImage"),
  selectionMark: document.querySelector("#selectionMark"),
  archiveUpdated: document.querySelector("#archiveUpdated"),
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
  homeHero: document.querySelector("#homeHero"),
};

const eventIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a7.5 7.5 0 0 0-7.5 7.5c0 5.6 7.5 11.5 7.5 11.5s7.5-5.9 7.5-11.5A7.5 7.5 0 0 0 12 2.5Zm0 10.3a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z" /></svg>`;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function titleCase(value) {
  const brandNames = { BMW: "BMW", AMC: "AMC", MINI: "MINI", MCLAREN: "McLaren" };
  if (brandNames[String(value).toUpperCase()]) return brandNames[String(value).toUpperCase()];
  return String(value).toLocaleLowerCase("en-US")
    .replace(/(^|[\s&/\-])([a-z])/g, (match, before, letter) => `${before}${letter.toUpperCase()}`)
    .replace(/\bImsa\b/g, "IMSA");
}

function formatDate(value) {
  if (!value) return "";
  if (/^\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  }
  return value;
}

function formatArchiveDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Last updated from Excel —";
  return `Last updated ${new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`))}`;
}

function activeModels() { return state.models.filter((model) => !model.cancelled); }
function catalogueModels() { return activeModels().filter((model) => !model.seriesOnly); }
function cancelledCount() { return state.models.filter((model) => model.cancelled && !model.seriesOnly).length; }
function countBy(items, getter) { return items.reduce((counts, item) => counts.set(getter(item), (counts.get(getter(item)) || 0) + 1), new Map()); }
function getBrands() { return [...countBy(catalogueModels(), (model) => model.brand).entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "en")); }
function getCollections() {
  const counts = new Map(specialCollectionOrder.map((name) => [name, 0]));
  activeModels().forEach((model) => model.collections.forEach((collection) => counts.set(collection, (counts.get(collection) || 0) + 1)));
  const ordered = specialCollectionOrder.map((name) => ({ name, count: counts.get(name) || 0 }));
  const extras = [...counts.entries()].filter(([name]) => !specialCollectionOrder.includes(name)).sort(([a], [b]) => a.localeCompare(b, "en")).map(([name, count]) => ({ name, count }));
  return [...ordered, ...extras.filter(({ name }) => !lastCollectionOrder.includes(name)), ...lastCollectionOrder.filter((name) => counts.has(name)).map((name) => ({ name, count: counts.get(name) }))];
}
function isSelected(kind, value) { return state.filter.kind === kind && state.filter.value === value; }
function filterLabel() { if (state.filter.kind === "all") return "All Models"; if (state.filter.kind === "status") return "Cancelled"; return state.filter.value; }
function filterType() { return state.filter.kind === "all" ? "CATALOGUE" : state.filter.kind.toUpperCase(); }
function filterCount() {
  const counts = catalogMeta.counts || {};
  if (state.filter.kind === "all") return counts.catalogueActive ?? catalogueModels().length;
  if (state.filter.kind === "status") return counts.catalogueCancelled ?? cancelledCount();
  const group = state.filter.kind === "brand" ? counts.brands : counts.collections;
  return (group && group[state.filter.value]) ?? getVisibleModels().length;
}
function initial(value) { return titleCase(value).split(/\s+/).map((word) => word[0]).join("").slice(0, 2); }
function visualFor(kind, value) {
  if (kind === "all") return { src: "assets/mini-gt-logo.png", alt: "MINI GT logo" };
  if (kind === "status") return { mark: "×" };
  const map = kind === "brand" ? visualAssets.brands : visualAssets.collections;
  return map[value] ? { src: map[value], alt: `${titleCase(value)} logo`, fullColour: true } : { mark: initial(value) };
}
function filterLogo(kind, value) {
  const visual = visualFor(kind, value);
  return `<span class="filter-logo">${visual.src ? `<img class="${visual.fullColour ? "full-colour" : ""}" src="${visual.src}" alt="" />` : `<b>${escapeHtml(visual.mark)}</b>`}</span>`;
}

function getVisibleModels() {
  const query = state.search.trim().toLocaleLowerCase("en");
  return state.models.filter((model) => {
    const matches = state.filter.kind === "status"
      ? model.cancelled && !model.seriesOnly
      : !model.cancelled && (
        (state.filter.kind === "all" && !model.seriesOnly)
        || (state.filter.kind === "brand" && !model.seriesOnly && model.brand === state.filter.value)
        || (state.filter.kind === "collection" && model.collections.includes(state.filter.value))
      );
    if (!matches) return false;
    return !query || [model.name, model.brand, model.event, model.date, ...model.collections].join(" ").toLocaleLowerCase("en").includes(query);
  });
}

function renderSidebar() {
  const collections = getCollections();
  const brands = getBrands();
  const collectionItems = collections.map(({ name }) => `<button class="side-filter ${isSelected("collection", name) ? "is-active" : ""}" type="button" data-filter-kind="collection" data-filter-value="${escapeHtml(name)}">${filterLogo("collection", name)}<span class="filter-label">${escapeHtml(titleCase(name.replace(/ Collection$/, "")))}</span></button>`).join("");
  const brandItems = brands.map(({ name }) => `<button class="brand-filter ${isSelected("brand", name) ? "is-active" : ""}" type="button" data-filter-kind="brand" data-filter-value="${escapeHtml(name)}">${filterLogo("brand", name)}<span class="filter-label ${name.includes(" ") ? "is-multiword" : "is-single-word"}">${escapeHtml(titleCase(name))}</span></button>`).join("");
  elements.sidebarNav.innerHTML = `
    <section><button class="archive-all ${isSelected("all", "all") ? "is-active" : ""}" type="button" data-filter-kind="all" data-filter-value="all"><small>EXPLORE THE ARCHIVE</small><span>All models</span><b>VIEW THE COMPLETE CATALOGUE</b></button><button class="side-status ${isSelected("status", "CANCELLED") ? "is-active" : ""}" type="button" data-filter-kind="status" data-filter-value="CANCELLED"><span>Cancelled</span><small>ARCHIVED MODELS</small></button></section>
    <section class="filter-group"><p class="filter-group-title">CURATED SERIES</p><div class="collection-list">${collectionItems}</div></section>
    <section class="filter-group"><p class="filter-group-title">SELECT A BRAND</p><div class="brand-grid">${brandItems}</div></section>`;
}

function renderQuickFilters() {
  const featured = [
    { kind: "all", value: "all", label: "ALL PROTOTYPES", logo: "" },
    ...getCollections().map(({ name }) => ({ kind: "collection", value: name, label: titleCase(name.replace(/ Collection$/, "")).toUpperCase(), logo: filterLogo("collection", name) })),
  ];
  elements.quickFilters.innerHTML = featured.map(({ kind, value, label, logo }) => `<button class="quick-filter ${isSelected(kind, value) ? "is-active" : ""}" type="button" data-filter-kind="${kind}" data-filter-value="${escapeHtml(value)}">${logo}<span>${label}</span></button>`).join("");
}

function renderSelection() {
  const visual = visualFor(state.filter.kind, state.filter.value);
  elements.homeHero.hidden = state.filter.kind !== "all";
  elements.title.textContent = titleCase(filterLabel());
  elements.eyebrow.textContent = filterType();
  elements.count.textContent = `${filterCount()} ${filterCount() === 1 ? "PROTOTYPE" : "PROTOTYPES"}`;
  if (visual.src) {
    elements.selectionImage.src = visual.src;
    elements.selectionImage.alt = visual.alt;
    elements.selectionImage.classList.toggle("full-colour", Boolean(visual.fullColour));
    elements.selectionImage.hidden = false;
    elements.selectionMark.hidden = true;
    elements.selectionImage.parentElement.classList.toggle("is-wide-logo", visual.src.endsWith("/qube-carz-inverted.png"));
  } else {
    elements.selectionImage.parentElement.classList.remove("is-wide-logo");
    elements.selectionMark.textContent = visual.mark;
    elements.selectionImage.hidden = true;
    elements.selectionMark.hidden = false;
  }
}

function photoStage(model) {
  if (!model.photos.length) return elements.missingPhoto.innerHTML;
  const first = model.photos[0];
  const controls = model.photos.length > 1 ? `<div class="gallery-controls" aria-label="Model photos">${model.photos.map((photo, index) => `<button class="gallery-dot ${index === 0 ? "is-active" : ""}" type="button" data-photo-index="${index}" aria-label="${escapeHtml(photo.label)} ${index + 1}">${index + 1}</button>`).join("")}</div>` : "";
  return `<div class="photo-stage" data-photo-stage><img src="${escapeHtml(first.src)}" alt="${escapeHtml(`${model.name} — ${first.label}`)}" loading="lazy" data-open-lightbox="true" tabindex="0" />${controls}</div>`;
}

function modelCard(model) {
  return `<article class="model-card" data-model-id="${escapeHtml(model.id)}">${photoStage(model)}<div class="card-info">${model.date ? `<div class="card-meta"><span>${escapeHtml(formatDate(model.date))}</span></div>` : ""}<h2 class="card-name">${escapeHtml(model.name)}</h2>${model.event ? `<p class="card-event">${eventIcon}<span>${escapeHtml(model.event)}</span></p>` : ""}${model.cancelled ? `<span class="cancelled-notice">CANCELLED</span>` : ""}${model.collections.length ? `<div class="card-collections">${model.collections.map((collection) => `<span class="collection-tag">${escapeHtml(collection.toUpperCase())}</span>`).join("")}</div>` : ""}</div></article>`;
}

function brandSection(name, models) {
  const visual = visualFor("brand", name);
  const logo = visual.src
    ? `<img src="${escapeHtml(visual.src)}" alt="" />`
    : `<b>${escapeHtml(visual.mark)}</b>`;
  return `<section class="brand-section" aria-labelledby="brand-${escapeHtml(slugFor(name))}">
    <header class="brand-section-header">
      <span class="brand-section-logo">${logo}</span>
      <div><h2 id="brand-${escapeHtml(slugFor(name))}">${escapeHtml(titleCase(name))}</h2></div>
      <span class="brand-section-count">${models.length} ${models.length === 1 ? "PROTOTYPE" : "PROTOTYPES"}</span>
    </header>
    <div class="brand-section-grid">${models.map(modelCard).join("")}</div>
  </section>`;
}

function slugFor(value) {
  return String(value).toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderCards() {
  const models = getVisibleModels();
  const label = titleCase(filterLabel());
  elements.activeFilterLine.textContent = state.search ? `Search results for “${state.search}” in “${label}”` : `${models.length} model${models.length === 1 ? "" : "s"} shown`;
  elements.modelGrid.hidden = models.length === 0;
  elements.emptyState.hidden = models.length !== 0;
  const groupByBrand = state.filter.kind !== "brand";
  elements.modelGrid.classList.toggle("is-grouped", groupByBrand);
  if (!groupByBrand) {
    elements.modelGrid.innerHTML = models.map(modelCard).join("");
    return;
  }
  const groups = [...models.reduce((map, model) => {
    if (!map.has(model.brand)) map.set(model.brand, []);
    map.get(model.brand).push(model);
    return map;
  }, new Map()).entries()].sort(([a], [b]) => a.localeCompare(b, "en"));
  elements.modelGrid.innerHTML = groups.map(([name, brandModels]) => brandSection(name, brandModels)).join("");
}

function render() { renderSidebar(); renderQuickFilters(); renderSelection(); renderCards(); }
function closeFilters() { elements.sidebar.classList.remove("is-open"); elements.backdrop.hidden = true; }
function chooseFilter(kind, value) { state.filter = { kind, value }; state.search = ""; elements.search.value = ""; render(); closeFilters(); window.location.hash = kind === "all" ? "all" : `${kind}/${encodeURIComponent(value)}`; }
function setCardPhoto(card, index) { const model = state.models.find((item) => item.id === card.dataset.modelId); if (!model || !model.photos[index]) return; const photo = model.photos[index]; const image = card.querySelector(".photo-stage img"); image.src = photo.src; image.alt = `${model.name} — ${photo.label}`; card.querySelectorAll(".gallery-dot").forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index)); }
function updateLightbox() { const photo = state.lightbox.photos[state.lightbox.index]; if (!photo) return; elements.lightboxImage.src = photo.src; elements.lightboxImage.alt = `${state.lightbox.modelName} — ${photo.label}`; elements.lightboxCaption.textContent = `${state.lightbox.modelName} · ${photo.label} (${state.lightbox.index + 1}/${state.lightbox.photos.length})`; const multiple = state.lightbox.photos.length > 1; elements.previousPhoto.hidden = !multiple; elements.nextPhoto.hidden = !multiple; }
function openLightbox(card) { const model = state.models.find((item) => item.id === card.dataset.modelId); if (!model || !model.photos.length) return; const active = [...card.querySelectorAll(".gallery-dot")].findIndex((dot) => dot.classList.contains("is-active")); state.lightbox = { photos: model.photos, index: Math.max(active, 0), modelName: model.name }; updateLightbox(); elements.lightbox.showModal(); }
function moveLightboxPhoto(direction) { const total = state.lightbox.photos.length; if (total < 2) return; state.lightbox.index = (state.lightbox.index + direction + total) % total; updateLightbox(); }
function applyHash() { const hash = decodeURIComponent(window.location.hash.replace(/^#/, "")); if (!hash || hash === "all") { state.filter = { kind: "all", value: "all" }; return; } const [kind, ...valueParts] = hash.split("/"); const value = valueParts.join("/"); if ((kind === "status" && value === "CANCELLED") || (kind === "brand" && getBrands().some((item) => item.name === value)) || (kind === "collection" && getCollections().some((item) => item.name === value))) state.filter = { kind, value }; }

document.addEventListener("click", (event) => { const filter = event.target.closest("[data-filter-kind]"); if (filter) chooseFilter(filter.dataset.filterKind, filter.dataset.filterValue); const gallery = event.target.closest(".gallery-dot"); if (gallery) { event.stopPropagation(); setCardPhoto(gallery.closest(".model-card"), Number(gallery.dataset.photoIndex)); } if (event.target.closest("[data-open-lightbox]")) openLightbox(event.target.closest(".model-card")); });
elements.search.addEventListener("input", (event) => { state.search = event.target.value; renderCards(); });
elements.openFilters.addEventListener("click", () => { elements.sidebar.classList.add("is-open"); elements.backdrop.hidden = false; });
elements.closeFilters.addEventListener("click", closeFilters); elements.backdrop.addEventListener("click", closeFilters); elements.clearFilters.addEventListener("click", () => chooseFilter("all", "all")); elements.closeLightbox.addEventListener("click", () => elements.lightbox.close()); elements.previousPhoto.addEventListener("click", () => moveLightboxPhoto(-1)); elements.nextPhoto.addEventListener("click", () => moveLightboxPhoto(1)); elements.lightbox.addEventListener("click", (event) => { if (event.target === elements.lightbox) elements.lightbox.close(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeFilters(); if (!elements.lightbox.open) return; if (event.key === "ArrowLeft") moveLightboxPhoto(-1); if (event.key === "ArrowRight") moveLightboxPhoto(1); });
window.addEventListener("hashchange", () => { applyHash(); render(); });

elements.archiveUpdated.textContent = formatArchiveDate(catalogMeta.lastUpdated);
fetch(sourceUrl).then((response) => { if (!response.ok) throw new Error(response.status === 404 ? "The deployment is missing the assets folder." : "The catalogue could not be loaded."); return response.json(); }).then((models) => { state.models = models; applyHash(); render(); }).catch((error) => { elements.modelGrid.innerHTML = `<p>${escapeHtml(error.message)}</p>`; console.error(error); });
