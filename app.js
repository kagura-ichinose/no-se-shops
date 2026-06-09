const fallbackImage = (() => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="588" viewBox="0 0 420 588">
  <rect width="420" height="588" rx="24" fill="#dbe3ec"/>
  <rect x="30" y="30" width="360" height="528" rx="20" fill="#eef3f7"/>
  <circle cx="210" cy="230" r="96" fill="#c8d4df"/>
  <rect x="86" y="374" width="248" height="28" rx="14" fill="#c8d4df"/>
  <rect x="116" y="424" width="188" height="18" rx="9" fill="#d4dde7"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
})();

const isFileMode = window.location.protocol === "file:";
const localStoreKey = "cardTradeBoardLocalItems";
const localPassword = "demo-pass";
const storageFallback = new Map();

function storageKey(kind, key) {
  return `${kind}:${key}`;
}

function safeStorageGet(kind, key) {
  try {
    return window[kind]?.getItem(key) || "";
  } catch {
    return storageFallback.get(storageKey(kind, key)) || "";
  }
}

function safeStorageSet(kind, key, value) {
  try {
    window[kind]?.setItem(key, value);
  } catch {
    storageFallback.set(storageKey(kind, key), value);
  }
}

function safeStorageRemove(kind, key) {
  try {
    window[kind]?.removeItem(key);
  } catch {
    storageFallback.delete(storageKey(kind, key));
  }
}

const state = {
  items: [],
  view: "shop",
  pendingView: null,
  search: "",
  sort: "updated-desc",
  tag: "all",
  groupByTag: false,
  canEdit: false,
  token: safeStorageGet("sessionStorage", "cardTradeToken"),
  currentItemId: null,
  dialogMode: "view",
  saleTarget: null
};

const els = {
  switchButtons: [...document.querySelectorAll("[data-view]")],
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  groupToggle: document.querySelector("#groupToggle"),
  historyStatsRoot: document.querySelector("#historyStatsRoot"),
  tagRail: document.querySelector("#tagRail"),
  listRoot: document.querySelector("#listRoot"),
  editButton: document.querySelector("#editButton"),
  editActions: document.querySelector("#editActions"),
  addItemButton: document.querySelector("#addItemButton"),
  lockButton: document.querySelector("#lockButton"),
  authDialog: document.querySelector("#authDialog"),
  authForm: document.querySelector("#authForm"),
  passwordInput: document.querySelector("#passwordInput"),
  authError: document.querySelector("#authError"),
  itemDialog: document.querySelector("#itemDialog"),
  itemForm: document.querySelector("#itemForm"),
  itemDialogTitle: document.querySelector("#itemDialogTitle"),
  readonlyType: document.querySelector("#readonlyType"),
  readonlyName: document.querySelector("#readonlyName"),
  readonlyAmount: document.querySelector("#readonlyAmount"),
  standardReadonlyDetails: document.querySelector("#standardReadonlyDetails"),
  readonlyCondition: document.querySelector("#readonlyCondition"),
  readonlyNotes: document.querySelector("#readonlyNotes"),
  readonlyTags: document.querySelector("#readonlyTags"),
  historyCardDetails: document.querySelector("#historyCardDetails"),
  previewImage: document.querySelector("#previewImage"),
  editFields: document.querySelector("#editFields"),
  itemType: document.querySelector("#itemType"),
  standardAmountField: document.querySelector("#standardAmountField"),
  amountLabel: document.querySelector("#amountLabel"),
  itemAmount: document.querySelector("#itemAmount"),
  historyDateField: document.querySelector("#historyDateField"),
  historyDate: document.querySelector("#historyDate"),
  standardFields: document.querySelector("#standardFields"),
  itemName: document.querySelector("#itemName"),
  itemImageUrl: document.querySelector("#itemImageUrl"),
  itemCondition: document.querySelector("#itemCondition"),
  itemTags: document.querySelector("#itemTags"),
  itemNotes: document.querySelector("#itemNotes"),
  historyFields: document.querySelector("#historyFields"),
  historyTitle: document.querySelector("#historyTitle"),
  historyImageUrl: document.querySelector("#historyImageUrl"),
  historyNotes: document.querySelector("#historyNotes"),
  addHistoryCardButton: document.querySelector("#addHistoryCardButton"),
  historyCardsEditor: document.querySelector("#historyCardsEditor"),
  itemError: document.querySelector("#itemError"),
  deleteItemButton: document.querySelector("#deleteItemButton"),
  saveItemButton: document.querySelector("#saveItemButton"),
  saleDialog: document.querySelector("#saleDialog"),
  saleForm: document.querySelector("#saleForm"),
  saleCardName: document.querySelector("#saleCardName"),
  saleAmount: document.querySelector("#saleAmount"),
  saleError: document.querySelector("#saleError"),
  toast: document.querySelector("#toast")
};

function createId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function yen(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function money(value) {
  const amount = Number(value || 0);
  return amount > 0 ? yen(amount) : "金額未設定";
}

function localCardImage(title, primary, accent) {
  const safeTitle = title.replace(/[<>&"]/g, "");
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="588" viewBox="0 0 420 588">
  <defs>
    <linearGradient id="card" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="shine" cx="34%" cy="24%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".72"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="420" height="588" rx="24" fill="#f2f5f8"/>
  <rect x="24" y="24" width="372" height="540" rx="20" fill="url(#card)"/>
  <rect x="48" y="56" width="324" height="238" rx="16" fill="url(#shine)"/>
  <path d="M58 426 C120 360 178 458 236 392 S330 346 362 286 V532 H58 Z" fill="#ffffff" opacity=".34"/>
  <rect x="56" y="326" width="308" height="24" rx="12" fill="#ffffff" opacity=".48"/>
  <rect x="56" y="366" width="236" height="18" rx="9" fill="#ffffff" opacity=".36"/>
  <text x="210" y="506" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#ffffff">${safeTitle}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function localSeedItems() {
  const timestamp = nowIso();
  return [
    {
      id: "local-shop-1",
      type: "shop",
      name: "旧裏サンプル ほのお",
      imageUrl: localCardImage("SHOP", "#e36f5a", "#f4c35a"),
      price: 900,
      budget: null,
      condition: "やや傷あり",
      notes: "角に白かけがあります。プレイ用として見てください。",
      tags: ["旧裏"],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "local-shop-2",
      type: "shop",
      name: "光りものサンプル",
      imageUrl: localCardImage("RARE", "#307e7a", "#89c2b9"),
      price: 2400,
      budget: null,
      condition: "目立つ傷なし",
      notes: "スリーブ保管。表面はきれいめです。",
      tags: ["キラ", "美品寄り"],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "local-trade-1",
      type: "trade",
      name: "探しています サンプルA",
      imageUrl: localCardImage("WANT", "#5f7fa6", "#b1c6d8"),
      price: null,
      budget: 1000,
      condition: "プレイ用可",
      notes: "折れ・大きな凹みがなければ相談したいです。",
      tags: ["1000円以下", "優先"],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "local-trade-2",
      type: "trade",
      name: "旧裏 募集中サンプル",
      imageUrl: localCardImage("TRADE", "#c96e4c", "#e8ad79"),
      price: null,
      budget: 3500,
      condition: "状態相談",
      notes: "画像を見て判断したいです。複数枚まとめての相談も歓迎です。",
      tags: ["旧裏", "募集中"],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "local-history-1",
      type: "history",
      title: "サンプル購入 まとめ",
      name: "サンプル購入 まとめ",
      imageUrl: localCardImage("LOT", "#506f9f", "#2f817f"),
      purchaseDate: todayValue(),
      notes: "複数枚購入のサンプルです。",
      cards: [
        {
          id: "local-history-card-1",
          name: "購入カードA",
          purchasePrice: 1200,
          notes: "表面きれいめ",
          sold: false,
          salePrice: null,
          soldAt: null
        },
        {
          id: "local-history-card-2",
          name: "購入カードB",
          purchasePrice: 800,
          notes: "プレイ用",
          sold: true,
          salePrice: 1500,
          soldAt: timestamp
        }
      ],
      tags: ["購入履歴"],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];
}

function localReadItems() {
  const raw = safeStorageGet("localStorage", localStoreKey);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      safeStorageRemove("localStorage", localStoreKey);
    }
  }
  const items = localSeedItems();
  safeStorageSet("localStorage", localStoreKey, JSON.stringify(items));
  return items;
}

function localWriteItems(items) {
  safeStorageSet("localStorage", localStoreKey, JSON.stringify(items));
}

function normalizeTags(tags) {
  const source = Array.isArray(tags) ? tags : String(tags || "").split(",");
  return [...new Set(source.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 12);
}

function normalizeHistoryCards(cards = [], existingCards = []) {
  const existingById = new Map(existingCards.map((card) => [card.id, card]));
  return cards
    .map((card) => {
      const existing = existingById.get(card.id) || {};
      const purchasePrice = Number(card.purchasePrice || 0);
      const salePrice = Number(card.salePrice ?? existing.salePrice ?? 0);
      const sold = Boolean(card.sold ?? existing.sold);
      return {
        id: card.id || createId(),
        name: String(card.name || "").trim().slice(0, 80),
        purchasePrice: Number.isFinite(purchasePrice) && purchasePrice > 0 ? Math.round(purchasePrice) : 0,
        notes: String(card.notes || "").trim().slice(0, 800),
        sold,
        salePrice: sold && Number.isFinite(salePrice) ? Math.max(1, Math.round(salePrice)) : null,
        soldAt: sold ? card.soldAt || existing.soldAt || nowIso() : null
      };
    })
    .filter((card) => card.name || card.purchasePrice || card.notes);
}

function localNormalizeItem(input, existing = {}) {
  const type = input.type === "trade" ? "trade" : input.type === "history" ? "history" : "shop";

  if (type === "history") {
    const title = String(input.title || input.name || "").trim().slice(0, 80);
    return {
      id: existing.id || createId(),
      type,
      title,
      name: title,
      imageUrl: String(input.imageUrl || "").trim().slice(0, 3000),
      purchaseDate: String(input.purchaseDate || "").trim().slice(0, 10),
      notes: String(input.notes || "").trim().slice(0, 1200),
      cards: normalizeHistoryCards(input.cards, existing.cards || []),
      tags: normalizeTags(input.tags),
      createdAt: existing.createdAt || nowIso(),
      updatedAt: nowIso()
    };
  }

  const amount = Number(input.amount ?? input.price ?? input.budget ?? 0);
  const cleanAmount = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
  return {
    id: existing.id || createId(),
    type,
    name: String(input.name || "").trim().slice(0, 80),
    imageUrl: String(input.imageUrl || "").trim().slice(0, 3000),
    price: type === "shop" ? cleanAmount : null,
    budget: type === "trade" ? cleanAmount : null,
    condition: String(input.condition || "").trim().slice(0, 80),
    notes: String(input.notes || "").trim().slice(0, 1200),
    tags: normalizeTags(input.tags),
    createdAt: existing.createdAt || nowIso(),
    updatedAt: nowIso()
  };
}

async function localApi(path, options = {}) {
  const method = options.method || "GET";
  const headers = new Headers(options.headers || {});
  const suppliedToken = headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  const isAdmin = suppliedToken === localPassword;

  if (path.includes("auth=verify")) {
    if (!isAdmin) throw new Error("Invalid password.");
    return { ok: true };
  }

  if (method === "GET") {
    const items = localReadItems();
    return {
      items: isAdmin ? items : items.filter((item) => item.type !== "history"),
      storage: "local"
    };
  }

  if (!isAdmin) throw new Error("Invalid password.");

  const body = options.body ? JSON.parse(options.body) : {};
  const items = localReadItems();

  if (method === "POST") {
    const item = localNormalizeItem(body);
    items.unshift(item);
    localWriteItems(items);
    return { item, items };
  }

  if (method === "PUT") {
    const index = items.findIndex((item) => item.id === body.id);
    if (index < 0) {
      const item = localNormalizeItem(body, { id: body.id });
      items.unshift(item);
      localWriteItems(items);
      return { item, items };
    }
    items[index] = localNormalizeItem(body, items[index]);
    localWriteItems(items);
    return { item: items[index], items };
  }

  if (method === "DELETE") {
    const nextItems = items.filter((item) => item.id !== body.id);
    localWriteItems(nextItems);
    return { ok: true, items: nextItems };
  }

  throw new Error("Unsupported action.");
}

function historyCards(item) {
  return Array.isArray(item.cards) ? item.cards : [];
}

function historyTotals(items) {
  const totals = { consumption: 0, profit: 0, soldCount: 0, cardCount: 0 };
  for (const item of items.filter((entry) => entry.type === "history")) {
    for (const card of historyCards(item)) {
      const purchasePrice = Number(card.purchasePrice || 0);
      totals.cardCount += 1;
      totals.consumption += purchasePrice;
      if (card.sold) {
        totals.soldCount += 1;
        totals.profit += purchasePrice - Number(card.salePrice || 0);
      }
    }
  }
  return totals;
}

function historyItemTitle(item) {
  return item.title || item.name || "購入履歴";
}

function amountOf(item) {
  if (item.type === "history") {
    return historyTotals([item]).consumption;
  }
  return Number(item.type === "shop" ? item.price : item.budget) || 0;
}

function profitOf(item) {
  return item.type === "history" ? historyTotals([item]).profit : 0;
}

function pageLabel(type) {
  if (type === "history") return "取引履歴";
  return type === "trade" ? "TRADE募集" : "ショップ";
}

function amountLabel(type) {
  if (type === "history") return "消費";
  return type === "trade" ? "予算" : "参考価格";
}

function tagsOf(item) {
  const tags = new Set((item.tags || []).map((tag) => String(tag).trim()).filter(Boolean));
  if (item.type !== "history") {
    const amount = amountOf(item);
    if (amount > 0 && amount <= 1000) tags.add("1000円以下");
  }
  if (item.type === "history") {
    const totals = historyTotals([item]);
    if (totals.soldCount) tags.add("売却済あり");
    if (totals.cardCount > totals.soldCount) tags.add("未売却あり");
  }
  if (!tags.size) tags.add("未分類");
  return [...tags];
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 2400);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }

  if (isFileMode) {
    return localApi(path, { ...options, headers });
  }

  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "通信に失敗しました。");
  }
  return payload;
}

async function loadItems() {
  const payload = await api("/api/cards");
  state.items = Array.isArray(payload.items) ? payload.items : [];
  render();
}

async function verifyStoredToken() {
  if (!state.token) return;
  try {
    await api("/api/cards?auth=verify");
    setAdminMode(true);
  } catch {
    safeStorageRemove("sessionStorage", "cardTradeToken");
    state.token = "";
    setAdminMode(false);
  }
}

function setAdminMode(enabled) {
  state.canEdit = enabled;
  document.body.classList.toggle("is-admin", enabled);
  els.editActions.hidden = true;

  if (!enabled) {
    state.items = state.items.filter((item) => item.type !== "history");
    if (state.view === "history") state.view = "shop";
    state.pendingView = null;
  }
}

function openAuthDialog(message = "") {
  els.authError.textContent = message;
  els.passwordInput.value = "";
  els.authDialog.showModal();
  requestAnimationFrame(() => els.passwordInput.focus());
}

function searchableText(item) {
  if (item.type === "history") {
    return [
      historyItemTitle(item),
      item.purchaseDate,
      item.notes,
      ...(item.tags || []),
      ...historyCards(item).flatMap((card) => [card.name, card.notes])
    ].join(" ");
  }
  return [item.name, item.condition, item.notes, ...(item.tags || [])].join(" ");
}

function filteredItems() {
  const needle = state.search.trim().toLowerCase();
  const items = state.items.filter((item) => {
    if (item.type !== state.view) return false;
    if (needle && !searchableText(item).toLowerCase().includes(needle)) return false;
    if (state.tag !== "all" && !tagsOf(item).includes(state.tag)) return false;
    return true;
  });

  return items.sort((a, b) => {
    if (state.sort === "amount-asc") return amountOf(a) - amountOf(b);
    if (state.sort === "amount-desc") return amountOf(b) - amountOf(a);
    if (state.sort === "profit-desc") return profitOf(b) - profitOf(a);
    if (state.sort === "name-asc") {
      return (a.name || a.title || "").localeCompare(b.name || b.title || "", "ja");
    }
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });
}

function renderTags() {
  const viewItems = state.items.filter((item) => item.type === state.view);
  const tags = [...new Set(viewItems.flatMap(tagsOf))].sort((a, b) => a.localeCompare(b, "ja"));
  if (state.tag !== "all" && !tags.includes(state.tag)) state.tag = "all";

  els.tagRail.innerHTML = "";
  els.tagRail.append(tagButton("all", `すべて ${viewItems.length}`));

  for (const tag of tags) {
    const count = viewItems.filter((item) => tagsOf(item).includes(tag)).length;
    els.tagRail.append(tagButton(tag, `${tag} ${count}`));
  }
}

function tagButton(tag, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `tag-chip${state.tag === tag ? " is-active" : ""}`;
  button.textContent = label;
  button.addEventListener("click", () => {
    state.tag = tag;
    render();
  });
  return button;
}

function renderHistoryStats() {
  const totals = historyTotals(state.items);
  const panel = document.createElement("section");
  panel.className = "history-stats";
  panel.innerHTML = `
    <div>
      <span>利益</span>
      <strong>${escapeHtml(yen(totals.profit))}</strong>
    </div>
    <div>
      <span>消費</span>
      <strong>${escapeHtml(yen(totals.consumption))}</strong>
    </div>
  `;
  return panel;
}

function renderHistoryStatsRoot() {
  els.historyStatsRoot.innerHTML = "";
  const shouldShow = state.view === "history" && state.canEdit;
  els.historyStatsRoot.hidden = !shouldShow;
  if (shouldShow) {
    els.historyStatsRoot.append(renderHistoryStats());
  }
}

function renderSortOptions() {
  const options = [
    ["updated-desc", "更新が新しい順"],
    ["amount-asc", "金額が低い順"],
    ["amount-desc", "金額が高い順"],
    ["name-asc", "名前順"]
  ];

  if (state.view === "history") {
    options.splice(3, 0, ["profit-desc", "利益が多い順"]);
  } else if (state.sort === "profit-desc") {
    state.sort = "updated-desc";
  }

  els.sortSelect.innerHTML = options
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
  els.sortSelect.value = state.sort;
}

function renderList() {
  if (state.view === "history" && !state.canEdit) {
    state.view = "shop";
  }

  const items = filteredItems();
  els.listRoot.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "まだ登録がありません";
    els.listRoot.append(empty);
    return;
  }

  if (!state.groupByTag) {
    els.listRoot.append(cardGrid(items));
    return;
  }

  const groups = new Map();
  for (const item of items) {
    const groupTag = state.tag === "all" ? tagsOf(item)[0] : state.tag;
    if (!groups.has(groupTag)) groups.set(groupTag, []);
    groups.get(groupTag).push(item);
  }

  for (const [tag, groupItems] of groups) {
    const section = document.createElement("section");
    const title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = `${tag} (${groupItems.length})`;
    section.append(title, cardGrid(groupItems));
    els.listRoot.append(section);
  }
}

function cardGrid(items) {
  const grid = document.createElement("div");
  grid.className = "card-grid";
  for (const item of items) {
    grid.append(cardTile(item));
  }
  return grid;
}

function cardTile(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `card-tile${item.type === "history" ? " history-tile" : ""}`;
  button.addEventListener("click", () => openItemDialog(item.id));

  const img = document.createElement("img");
  img.className = `card-art${item.type === "history" ? " history-art" : ""}`;
  img.src = item.imageUrl || fallbackImage;
  img.alt = item.type === "history" ? historyItemTitle(item) : item.name;
  img.loading = "lazy";
  img.onerror = () => {
    img.onerror = null;
    img.src = fallbackImage;
  };

  const copy = document.createElement("div");
  copy.className = "card-copy";

  if (item.type === "history") {
    const totals = historyTotals([item]);
    copy.innerHTML = `
      <h3>${escapeHtml(historyItemTitle(item))}</h3>
      <p class="amount">消費: ${escapeHtml(yen(totals.consumption))}</p>
      <p class="meta-line">購入日: ${escapeHtml(item.purchaseDate || "未設定")} / ${totals.cardCount}枚</p>
      <p class="meta-line">利益: ${escapeHtml(yen(totals.profit))}</p>
      <div class="chip-row">${tagsOf(item).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}</div>
    `;
  } else {
    copy.innerHTML = `
      <h3>${escapeHtml(item.name)}</h3>
      <p class="amount">${escapeHtml(amountLabel(item.type))}: ${escapeHtml(money(amountOf(item)))}</p>
      <p class="meta-line">${escapeHtml(item.condition || "状態未設定")}</p>
      <div class="chip-row">${tagsOf(item).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}</div>
    `;
  }

  button.append(img, copy);
  return button;
}

function render() {
  if (state.view === "history" && !state.canEdit) {
    state.view = "shop";
  }

  els.switchButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
  els.searchInput.value = state.search;
  renderSortOptions();
  els.groupToggle.checked = state.groupByTag;
  renderHistoryStatsRoot();
  renderTags();
  renderList();
}

function currentItem() {
  return state.items.find((item) => item.id === state.currentItemId) || null;
}

function openItemDialog(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  state.currentItemId = id;
  state.dialogMode = "view";
  fillDialog(item);
  els.itemDialog.showModal();
}

function openCreateDialog() {
  if (state.view === "history" && !state.canEdit) {
    state.pendingView = "history";
    openAuthDialog("取引履歴を開くには編集パスワードが必要です。");
    return;
  }

  state.currentItemId = null;
  state.dialogMode = "create";
  const item =
    state.view === "history"
      ? {
          type: "history",
          title: "",
          name: "",
          imageUrl: "",
          purchaseDate: todayValue(),
          notes: "",
          cards: [{ id: createId(), name: "", purchasePrice: 0, notes: "", sold: false }]
        }
      : {
          type: state.view,
          name: "",
          imageUrl: "",
          price: state.view === "shop" ? 0 : null,
          budget: state.view === "trade" ? 0 : null,
          condition: "",
          notes: "",
          tags: []
        };

  fillDialog(item);
  els.itemDialog.showModal();
  requestAnimationFrame(() => {
    if (item.type === "history") els.historyTitle.focus();
    else els.itemName.focus();
  });
}

function fillDialog(item) {
  const editable = state.canEdit;
  const isHistory = item.type === "history";
  const amount = amountOf(item);
  const title = isHistory ? historyItemTitle(item) : item.name || "新しいカード";

  els.itemDialogTitle.textContent =
    state.dialogMode === "create" ? (isHistory ? "取引履歴追加" : "カード追加") : editable ? "編集" : "詳細";
  els.readonlyType.textContent = pageLabel(item.type);
  els.readonlyName.textContent = title;
  els.readonlyAmount.textContent = isHistory
    ? `消費: ${yen(amount)} / 利益: ${yen(historyTotals([item]).profit)}`
    : `${amountLabel(item.type)}: ${money(amount)}`;
  els.previewImage.src = item.imageUrl || fallbackImage;
  els.previewImage.alt = title;
  els.previewImage.onerror = () => {
    els.previewImage.onerror = null;
    els.previewImage.src = fallbackImage;
  };

  els.standardReadonlyDetails.hidden = isHistory || editable;
  els.historyCardDetails.hidden = !isHistory;
  els.editFields.hidden = !editable;
  els.saveItemButton.hidden = !editable;
  els.deleteItemButton.hidden = state.dialogMode === "create" || !editable;

  if (!isHistory) {
    els.readonlyCondition.textContent = item.condition || "状態未設定";
    els.readonlyNotes.textContent = item.notes || "備考なし";
    els.readonlyTags.innerHTML = tagsOf(item)
      .map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`)
      .join("");
  }

  els.itemType.value = item.type;
  els.itemAmount.value = amount || "";
  els.itemName.value = item.name || "";
  els.itemImageUrl.value = item.imageUrl || "";
  els.itemCondition.value = item.condition || "";
  els.itemTags.value = (item.tags || []).join(", ");
  els.itemNotes.value = item.notes || "";

  els.historyTitle.value = item.title || item.name || "";
  els.historyImageUrl.value = item.imageUrl || "";
  els.historyDate.value = item.purchaseDate || todayValue();
  els.historyNotes.value = item.notes || "";

  toggleTypeFields();
  renderHistoryDetails(item);
  renderHistoryEditor(historyCards(item));

  els.itemError.textContent = "";
}

function toggleTypeFields() {
  const type = els.itemType.value;
  const isHistory = type === "history";
  els.standardAmountField.hidden = isHistory;
  els.historyDateField.hidden = !isHistory;
  els.standardFields.hidden = isHistory;
  els.historyFields.hidden = !isHistory;
  els.amountLabel.textContent = amountLabel(type);
  setContainerControlsDisabled(els.standardAmountField, isHistory);
  setContainerControlsDisabled(els.standardFields, isHistory);
  setContainerControlsDisabled(els.historyDateField, !isHistory);
  setContainerControlsDisabled(els.historyFields, !isHistory);

  if (isHistory && !els.historyCardsEditor.children.length) {
    renderHistoryEditor([{ id: createId(), name: "", purchasePrice: 0, notes: "", sold: false }]);
    setContainerControlsDisabled(els.historyFields, false);
  }
}

function setContainerControlsDisabled(container, disabled) {
  container.querySelectorAll("input, select, textarea, button").forEach((control) => {
    control.disabled = disabled;
  });
}

function renderHistoryDetails(item) {
  els.historyCardDetails.innerHTML = "";
  if (item.type !== "history") return;

  const cards = historyCards(item);
  const notes = document.createElement("div");
  notes.className = "history-note";
  notes.textContent = item.notes || "全体の備考なし";
  els.historyCardDetails.append(notes);

  if (!cards.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.textContent = "購入カードがありません";
    els.historyCardDetails.append(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "history-card-list";

  for (const card of cards) {
    const purchasePrice = Number(card.purchasePrice || 0);
    const salePrice = Number(card.salePrice || 0);
    const profit = purchasePrice - salePrice;
    const row = document.createElement("div");
    row.className = `history-card-row${card.sold ? " is-sold" : ""}`;
    row.innerHTML = `
      <div class="history-card-copy">
        <h3>${escapeHtml(card.name || "カード名未設定")}</h3>
        <p>購入値段: <strong>${escapeHtml(yen(purchasePrice))}</strong></p>
        <p>${escapeHtml(card.notes || "備考なし")}</p>
        ${
          card.sold
            ? `<p class="sold-line">売却済: ${escapeHtml(yen(salePrice))} / 利益: ${escapeHtml(yen(profit))}</p>`
            : `<p class="unsold-line">未売却</p>`
        }
      </div>
    `;

    if (state.canEdit && !card.sold && state.dialogMode !== "create") {
      const sellButton = document.createElement("button");
      sellButton.type = "button";
      sellButton.className = "sell-button";
      sellButton.textContent = "売却";
      sellButton.addEventListener("click", () => openSaleDialog(item.id, card.id));
      row.append(sellButton);
    }

    list.append(row);
  }

  els.historyCardDetails.append(list);
}

function renderHistoryEditor(cards) {
  els.historyCardsEditor.innerHTML = "";
  const source = cards.length ? cards : [{ id: createId(), name: "", purchasePrice: 0, notes: "", sold: false }];
  source.forEach((card) => addHistoryCardRow(card));
}

function nextPurchasePrice(value) {
  const current = Number(value || 0);
  if (current < 10) return 10;
  if (current < 30) return 30;
  if (current < 33) return 33;
  if (current < 39) return 39;
  if (current < 100) return 100;
  if (current % 100 === 0) return current + 100;
  return Math.ceil(current / 100) * 100;
}

function previousPurchasePrice(value) {
  const current = Number(value || 0);
  if (current <= 10) return 0;
  if (current <= 30) return 10;
  if (current <= 33) return 30;
  if (current <= 39) return 33;
  if (current <= 100) return 39;
  if (current % 100 === 0) return current - 100;
  return Math.floor(current / 100) * 100;
}

function attachPurchasePriceStepper(input) {
  input.dataset.lastPurchasePrice = input.value || "0";

  input.addEventListener("focus", () => {
    input.dataset.lastPurchasePrice = input.value || "0";
  });

  input.addEventListener("input", () => {
    const previous = Number(input.dataset.lastPurchasePrice || 0);
    const current = Number(input.value || 0);

    if (Number.isFinite(previous) && Number.isFinite(current) && Math.abs(current - previous) === 1) {
      input.value = String(current > previous ? nextPurchasePrice(previous) : previousPurchasePrice(previous));
    }

    input.dataset.lastPurchasePrice = input.value || "0";
  });
}

function setPurchasePrice(input, value) {
  input.value = String(Math.max(0, Number(value || 0)));
  input.dataset.lastPurchasePrice = input.value || "0";
}

function addHistoryCardRow(card = {}) {
  const row = document.createElement("div");
  row.className = "history-editor-row";
  row.dataset.cardId = card.id || createId();
  row.dataset.sold = card.sold ? "true" : "false";
  row.dataset.salePrice = card.salePrice ?? "";
  row.dataset.soldAt = card.soldAt || "";
  row.innerHTML = `
    <div class="two-cols">
      <label class="field">
        <span>カード名</span>
        <input class="history-card-name" type="text" maxlength="80" value="${escapeHtml(card.name || "")}">
      </label>
      <label class="field">
        <span>購入値段</span>
        <div class="price-stepper">
          <input class="history-card-price" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(card.purchasePrice || "")}">
          <div class="price-stepper-buttons" aria-label="購入値段の上下">
            <button class="price-step-button price-step-up" type="button" aria-label="次の購入値段">▲</button>
            <button class="price-step-button price-step-down" type="button" aria-label="前の購入値段">▼</button>
          </div>
        </div>
      </label>
    </div>
    <label class="field">
      <span>備考</span>
      <textarea class="history-card-notes" rows="1" maxlength="800">${escapeHtml(card.notes || "")}</textarea>
    </label>
    <div class="history-editor-actions">
      ${
        card.sold
          ? `<span class="sold-line">売却済: ${escapeHtml(yen(card.salePrice || 0))}</span>`
          : `<span class="unsold-line">未売却</span>`
      }
      <button class="plain-button remove-history-card" type="button">このカードを削除</button>
    </div>
  `;

  row.querySelector(".remove-history-card").addEventListener("click", () => {
    if (els.historyCardsEditor.children.length <= 1) {
      showToast("購入カードは1枚以上必要です");
      return;
    }
    row.remove();
  });

  const priceInput = row.querySelector(".history-card-price");
  attachPurchasePriceStepper(priceInput);
  row.querySelector(".price-step-up").addEventListener("click", () => {
    setPurchasePrice(priceInput, nextPurchasePrice(priceInput.value));
  });
  row.querySelector(".price-step-down").addEventListener("click", () => {
    setPurchasePrice(priceInput, previousPurchasePrice(priceInput.value));
  });

  els.historyCardsEditor.append(row);
}

function readHistoryEditorCards() {
  return [...els.historyCardsEditor.querySelectorAll(".history-editor-row")]
    .map((row) => {
      const purchasePrice = Number(row.querySelector(".history-card-price").value || 0);
      const salePrice = Number(row.dataset.salePrice || 0);
      const sold = row.dataset.sold === "true";
      return {
        id: row.dataset.cardId,
        name: row.querySelector(".history-card-name").value.trim(),
        purchasePrice,
        notes: row.querySelector(".history-card-notes").value.trim(),
        sold,
        salePrice: sold ? salePrice : null,
        soldAt: sold ? row.dataset.soldAt || nowIso() : null
      };
    })
    .filter((card) => card.name || card.purchasePrice || card.notes);
}

function formPayload() {
  const type = els.itemType.value === "trade" ? "trade" : els.itemType.value === "history" ? "history" : "shop";

  if (type === "history") {
    const title = els.historyTitle.value.trim();
    return {
      id: currentItem()?.id,
      type,
      title,
      name: title,
      imageUrl: els.historyImageUrl.value.trim(),
      purchaseDate: els.historyDate.value,
      notes: els.historyNotes.value.trim(),
      cards: readHistoryEditorCards(),
      tags: ["購入履歴"]
    };
  }

  const amount = Number(els.itemAmount.value || 0);
  return {
    id: currentItem()?.id,
    type,
    name: els.itemName.value.trim(),
    imageUrl: els.itemImageUrl.value.trim(),
    amount,
    price: type === "shop" ? amount : null,
    budget: type === "trade" ? amount : null,
    condition: els.itemCondition.value.trim(),
    notes: els.itemNotes.value.trim(),
    tags: els.itemTags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  };
}

async function saveItem() {
  els.itemError.textContent = "";
  const payload = formPayload();

  if (payload.type === "history") {
    if (!payload.title) {
      els.itemError.textContent = "購入メモ名を入力してください。";
      return;
    }
    if (!payload.cards.length) {
      els.itemError.textContent = "購入カードを1枚以上入力してください。";
      return;
    }
  } else if (!payload.name) {
    els.itemError.textContent = "カード名を入力してください。";
    return;
  }

  const method = state.dialogMode === "create" ? "POST" : "PUT";
  const result = await api("/api/cards", {
    method,
    body: JSON.stringify(payload)
  });

  state.items = result.items;
  state.view = payload.type;
  els.itemDialog.close();
  render();
  showToast(state.dialogMode === "create" ? "追加しました" : "保存しました");
}

async function deleteCurrentItem() {
  const item = currentItem();
  if (!item) return;
  const title = item.type === "history" ? historyItemTitle(item) : item.name;
  if (!confirm(`「${title}」を削除しますか？`)) return;

  const result = await api("/api/cards", {
    method: "DELETE",
    body: JSON.stringify({ id: item.id })
  });

  state.items = result.items;
  els.itemDialog.close();
  render();
  showToast("削除しました");
}

function openSaleDialog(itemId, cardId) {
  const item = state.items.find((entry) => entry.id === itemId);
  const card = historyCards(item || {}).find((entry) => entry.id === cardId);
  if (!item || !card) return;

  state.saleTarget = { itemId, cardId };
  els.saleCardName.textContent = card.name || "カード名未設定";
  els.saleAmount.value = "";
  els.saleError.textContent = "";
  els.saleDialog.showModal();
  requestAnimationFrame(() => els.saleAmount.focus());
}

async function saveSale() {
  const amount = Number(els.saleAmount.value || 0);
  if (!Number.isInteger(amount) || amount < 1) {
    els.saleError.textContent = "売却金額は1以上の整数で入力してください。";
    return;
  }

  const target = state.saleTarget;
  const item = state.items.find((entry) => entry.id === target?.itemId);
  if (!item) return;

  const updated = {
    ...item,
    cards: historyCards(item).map((card) =>
      card.id === target.cardId
        ? {
            ...card,
            sold: true,
            salePrice: amount,
            soldAt: nowIso()
          }
        : card
    )
  };

  const result = await api("/api/cards", {
    method: "PUT",
    body: JSON.stringify(updated)
  });

  state.items = result.items;
  state.saleTarget = null;
  els.saleDialog.close();
  const refreshed = state.items.find((entry) => entry.id === item.id);
  if (refreshed && els.itemDialog.open) fillDialog(refreshed);
  render();
  showToast("売却済みにしました");
}

function attachEvents() {
  els.switchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = button.dataset.view;
      if (nextView === "history" && !state.canEdit) {
        state.pendingView = "history";
        openAuthDialog("取引履歴を開くには編集パスワードが必要です。");
        return;
      }
      state.view = nextView;
      state.tag = "all";
      render();
    });
  });

  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderList();
  });

  els.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderList();
  });

  els.groupToggle.addEventListener("change", (event) => {
    state.groupByTag = event.target.checked;
    renderList();
  });

  els.editButton.addEventListener("click", () => {
    if (!state.canEdit) {
      openAuthDialog();
      return;
    }
    els.editActions.hidden = !els.editActions.hidden;
  });

  els.addItemButton.addEventListener("click", () => {
    els.editActions.hidden = true;
    openCreateDialog();
  });

  els.lockButton.addEventListener("click", () => {
    safeStorageRemove("sessionStorage", "cardTradeToken");
    state.token = "";
    setAdminMode(false);
    render();
    showToast("編集を終了しました");
  });

  els.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    els.authError.textContent = "";
    const token = els.passwordInput.value.trim();
    if (!token) return;

    try {
      state.token = token;
      await api("/api/cards?auth=verify");
      safeStorageSet("sessionStorage", "cardTradeToken", token);
      setAdminMode(true);
      await loadItems();
      if (state.pendingView) {
        state.view = state.pendingView;
        state.pendingView = null;
      }
      els.authDialog.close();
      render();
      showToast("編集モードになりました");
    } catch (error) {
      state.token = "";
      safeStorageRemove("sessionStorage", "cardTradeToken");
      els.authError.textContent = error.message || "パスワードが違います。";
    }
  });

  document.querySelectorAll("[data-close-auth]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pendingView = null;
      els.authError.textContent = "";
      els.authDialog.close();
    });
  });

  els.itemType.addEventListener("change", toggleTypeFields);

  els.addHistoryCardButton.addEventListener("click", () => {
    addHistoryCardRow({ id: createId(), name: "", purchasePrice: 0, notes: "", sold: false });
  });

  els.itemForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.canEdit) return;
    try {
      await saveItem();
    } catch (error) {
      els.itemError.textContent = error.message || "保存できませんでした。";
    }
  });

  els.deleteItemButton.addEventListener("click", async () => {
    if (!state.canEdit) return;
    try {
      await deleteCurrentItem();
    } catch (error) {
      els.itemError.textContent = error.message || "削除できませんでした。";
    }
  });

  document.querySelectorAll("[data-close-item]").forEach((button) => {
    button.addEventListener("click", () => els.itemDialog.close());
  });

  els.itemDialog.addEventListener("cancel", () => {
    els.itemError.textContent = "";
  });

  document.querySelectorAll("[data-close-sale]").forEach((button) => {
    button.addEventListener("click", () => {
      state.saleTarget = null;
      els.saleError.textContent = "";
      els.saleDialog.close();
    });
  });

  els.saleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await saveSale();
    } catch (error) {
      els.saleError.textContent = error.message || "売却処理に失敗しました。";
    }
  });
}

async function init() {
  attachEvents();
  await verifyStoredToken();
  await loadItems();
  render();
}

init().catch((error) => {
  if (els.historyStatsRoot) els.historyStatsRoot.hidden = true;
  els.listRoot.innerHTML = `<div class="empty-state">${escapeHtml(error.message || "読み込みに失敗しました")}</div>`;
});
