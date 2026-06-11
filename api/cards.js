import { randomUUID, timingSafeEqual } from "node:crypto";

const STORE_KEY = "card-trade-board:v1";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_DEFAULT_BRANCH = "main";
const GITHUB_DEFAULT_PATH = "data/cards.json";
const GITHUB_COMMIT_MESSAGE = "Update card trade board data";
let memoryItems;

const nowIso = () => new Date().toISOString();

function sampleCardImage(title, primary, accent) {
  const safeTitle = title.replace(/[<>&"]/g, "");
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="588" viewBox="0 0 420 588">
  <defs>
    <linearGradient id="card" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="shine" cx="35%" cy="24%" r="70%">
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

const SEED_ITEMS = [
  {
    id: "seed-shop-1",
    type: "shop",
    name: "旧裏サンプル ほのお",
    imageUrl: sampleCardImage("SHOP", "#e36f5a", "#f4c35a"),
    price: 900,
    budget: null,
    condition: "やや傷あり",
    notes: "角に白かけがあります。プレイ用として見てください。",
    tags: ["旧裏"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "seed-shop-2",
    type: "shop",
    name: "光りものサンプル",
    imageUrl: sampleCardImage("RARE", "#307e7a", "#89c2b9"),
    price: 2400,
    budget: null,
    condition: "目立つ傷なし",
    notes: "スリーブ保管。表面はきれいめです。",
    tags: ["キラ", "美品寄り"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "seed-trade-1",
    type: "trade",
    name: "探しています サンプルA",
    imageUrl: sampleCardImage("WANT", "#5f7fa6", "#b1c6d8"),
    price: null,
    budget: 1000,
    condition: "プレイ用可",
    notes: "折れ・大きな凹みがなければ相談したいです。",
    tags: ["1000円以下", "優先"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "seed-trade-2",
    type: "trade",
    name: "旧裏 募集中サンプル",
    imageUrl: sampleCardImage("TRADE", "#c96e4c", "#e8ad79"),
    price: null,
    budget: 3500,
    condition: "状態相談",
    notes: "画像を見て判断したいです。複数枚まとめての相談も歓迎です。",
    tags: ["旧裏", "募集中"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "seed-history-1",
    type: "history",
    title: "サンプル購入 まとめ",
    name: "サンプル購入 まとめ",
    imageUrl: sampleCardImage("LOT", "#506f9f", "#2f817f"),
    purchaseDate: nowIso().slice(0, 10),
    notes: "複数枚購入のサンプルです。",
    cards: [
      {
        id: "seed-history-card-1",
        name: "購入カードA",
        purchasePrice: 1200,
        notes: "表面きれいめ",
        sold: false,
        salePrice: null,
        soldAt: null
      },
      {
        id: "seed-history-card-2",
        name: "購入カードB",
        purchasePrice: 800,
        notes: "プレイ用",
        sold: true,
        salePrice: 1500,
        soldAt: nowIso()
      }
    ],
    tags: ["購入履歴"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

const DEFAULT_ITEMS = [
  {
    id: "sample-shop-1",
    type: "shop",
    name: "旧裏サンプル ほのお",
    imageUrl: sampleCardImage("SHOP", "#b96154", "#c7a24f"),
    price: 900,
    budget: null,
    condition: "やや傷あり",
    notes: "角に白かけがあります。プレイ用として見てください。",
    tags: ["旧裏", "1000円以下"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "sample-shop-2",
    type: "shop",
    name: "光りものサンプル",
    imageUrl: sampleCardImage("RARE", "#4b6f79", "#b4bbb8"),
    price: 2400,
    budget: null,
    condition: "目立つ傷なし",
    notes: "スリーブ保管。表面はきれいめです。",
    tags: ["キラ", "美品寄り"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "sample-trade-1",
    type: "trade",
    name: "探しています サンプルA",
    imageUrl: sampleCardImage("WANT", "#536e8e", "#a7b9c2"),
    price: null,
    budget: 1000,
    condition: "プレイ用可",
    notes: "折れ・大きな凹みがなければ相談したいです。",
    tags: ["1000円以下", "優先"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "sample-history-1",
    type: "history",
    title: "サンプル購入 まとめ",
    name: "サンプル購入 まとめ",
    imageUrl: sampleCardImage("LOT", "#586a7a", "#9f8b68"),
    purchaseDate: nowIso().slice(0, 10),
    notes: "複数枚購入のサンプルです。",
    cards: [
      {
        id: "sample-history-card-1",
        name: "購入カードA",
        purchasePrice: 1200,
        notes: "表面きれいめ",
        sold: false,
        salePrice: null,
        soldAt: null
      },
      {
        id: "sample-history-card-2",
        name: "購入カードB",
        purchasePrice: 800,
        notes: "プレイ用",
        sold: true,
        salePrice: 500,
        soldAt: nowIso()
      }
    ],
    tags: ["購入履歴"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

function cloneItems(items) {
  return JSON.parse(JSON.stringify(items));
}

function cleanEnv(name) {
  return String(process.env[name] || "").trim();
}

function getGithubConfig() {
  const token = cleanEnv("GITHUB_TOKEN");
  const owner = cleanEnv("GITHUB_OWNER");
  const repo = cleanEnv("GITHUB_REPO");

  if (!token || !owner || !repo) return null;

  return {
    token,
    owner,
    repo,
    branch: cleanEnv("GITHUB_BRANCH") || GITHUB_DEFAULT_BRANCH,
    path: cleanEnv("GITHUB_DATA_PATH") || cleanEnv("DATA_FILE_PATH") || GITHUB_DEFAULT_PATH
  };
}

function hasGithubStore() {
  return Boolean(getGithubConfig());
}

function encodeGithubPath(filePath) {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

function githubContentsUrl(config, includeRef = false) {
  const url = new URL(
    `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodeGithubPath(config.path)}`
  );
  if (includeRef) url.searchParams.set("ref", config.branch);
  return url.toString();
}

function githubHeaders(config) {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "card-trade-board"
  };
}

function decodeGithubContent(content) {
  return Buffer.from(String(content || "").replace(/\s/g, ""), "base64").toString("utf8");
}

function encodeGithubContent(content) {
  return Buffer.from(content, "utf8").toString("base64");
}

function parseStoredItems(raw) {
  const value = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(value)) {
    throw new Error("Stored card data must be a JSON array.");
  }
  return value;
}

async function readGithubFile(config) {
  const response = await fetch(githubContentsUrl(config, true), {
    headers: githubHeaders(config)
  });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(payload.message || `GitHub request failed with ${response.status}`);
  }

  if (Array.isArray(payload) || payload.type !== "file") {
    throw new Error(`${config.path} must be a JSON file, not a directory.`);
  }

  try {
    return {
      items: parseStoredItems(decodeGithubContent(payload.content)),
      sha: payload.sha
    };
  } catch (error) {
    throw new Error(`GitHub data file is not valid JSON: ${error.message}`);
  }
}

async function writeGithubItems(items, config, message = GITHUB_COMMIT_MESSAGE) {
  const safeItems = cloneItems(items);
  const current = await readGithubFile(config);
  const body = {
    message,
    branch: config.branch,
    content: encodeGithubContent(`${JSON.stringify(safeItems, null, 2)}\n`)
  };

  if (current?.sha) {
    body.sha = current.sha;
  }

  const response = await fetch(githubContentsUrl(config), {
    method: "PUT",
    headers: githubHeaders(config),
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || `GitHub save failed with ${response.status}`);
  }

  return safeItems;
}

async function readGithubItems(config) {
  const file = await readGithubFile(config);
  if (file) return cloneItems(file.items);

  await writeGithubItems(DEFAULT_ITEMS, config, "Initialize card trade board data");
  return cloneItems(DEFAULT_ITEMS);
}

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvCommand(command, ...args) {
  const response = await fetch(process.env.KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([command, ...args])
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `KV request failed with ${response.status}`);
  }

  return payload.result;
}

async function readItems() {
  const githubConfig = getGithubConfig();
  if (githubConfig) {
    return readGithubItems(githubConfig);
  }

  if (hasKv()) {
    const value = await kvCommand("GET", STORE_KEY);
    if (!value) {
      await kvCommand("SET", STORE_KEY, JSON.stringify(DEFAULT_ITEMS));
      return cloneItems(DEFAULT_ITEMS);
    }
    return parseStoredItems(value);
  }

  if (!memoryItems) {
    memoryItems = cloneItems(DEFAULT_ITEMS);
  }

  return cloneItems(memoryItems);
}

async function writeItems(items) {
  const safeItems = cloneItems(items);
  const githubConfig = getGithubConfig();
  if (githubConfig) {
    memoryItems = await writeGithubItems(safeItems, githubConfig);
    return;
  }

  if (hasKv()) {
    await kvCommand("SET", STORE_KEY, JSON.stringify(safeItems));
  }
  memoryItems = safeItems;
}

function getStorageType() {
  if (hasGithubStore()) return "github";
  if (hasKv()) return "kv";
  return "memory";
}

function getAdminToken() {
  return (
    process.env.ADMIN_TOKEN ||
    process.env.EDIT_TOKEN ||
    process.env.EDIT_PASSWORD ||
    (process.env.VERCEL ? "" : "demo-pass")
  );
}

function safeEqual(a, b) {
  const left = Buffer.from(a || "");
  const right = Buffer.from(b || "");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function getSuppliedToken(req) {
  const header =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    req.headers?.["x-admin-token"] ||
    "";
  return String(header).replace(/^Bearer\s+/i, "").trim();
}

function isAdminRequest(req) {
  const expected = getAdminToken();
  return Boolean(expected && safeEqual(getSuppliedToken(req), expected));
}

function requireAdmin(req) {
  const expected = getAdminToken();
  if (!expected) {
    const error = new Error("ADMIN_TOKEN is not configured.");
    error.status = 500;
    throw error;
  }

  if (!safeEqual(getSuppliedToken(req), expected)) {
    const error = new Error("Invalid password.");
    error.status = 401;
    throw error;
  }
}

function getQuery(req) {
  const url = new URL(req.url || "/api/cards", "http://localhost");
  return Object.fromEntries(url.searchParams.entries());
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function normalizeTags(tags) {
  const source = Array.isArray(tags) ? tags : String(tags || "").split(",");
  const seen = new Set();
  const result = [];

  for (const tag of source) {
    const clean = String(tag).trim().slice(0, 24);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
    if (result.length >= 12) break;
  }

  return result;
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
        id: card.id || randomUUID(),
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

function normalizeItem(input, existing = {}) {
  const type = input.type === "trade" ? "trade" : input.type === "history" ? "history" : "shop";

  if (type === "history") {
    const title = String(input.title || input.name || "").trim().slice(0, 80);
    if (!title) {
      const error = new Error("History title is required.");
      error.status = 400;
      throw error;
    }

    const cards = normalizeHistoryCards(input.cards, existing.cards || []);
    if (!cards.length) {
      const error = new Error("At least one purchased card is required.");
      error.status = 400;
      throw error;
    }

    return {
      id: existing.id || randomUUID(),
      type,
      title,
      name: title,
      imageUrl: String(input.imageUrl || "").trim().slice(0, 3000),
      purchaseDate: String(input.purchaseDate || "").trim().slice(0, 10),
      notes: String(input.notes || "").trim().slice(0, 1200),
      cards,
      tags: normalizeTags(input.tags),
      createdAt: existing.createdAt || nowIso(),
      updatedAt: nowIso()
    };
  }

  const amount = Number(input.amount ?? input.price ?? input.budget ?? 0);
  const cleanAmount = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
  const name = String(input.name || "").trim().slice(0, 80);

  if (!name) {
    const error = new Error("Card name is required.");
    error.status = 400;
    throw error;
  }

  return {
    id: existing.id || randomUUID(),
    type,
    name,
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

function publicItemsFor(req, items) {
  return isAdminRequest(req) ? items : items.filter((item) => item.type !== "history");
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function sendError(res, error) {
  const status = error.status || 500;
  sendJson(res, status, { error: error.message || "Unexpected error." });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const query = getQuery(req);

    if (req.method === "GET") {
      if (query.auth === "verify") {
        requireAdmin(req);
        sendJson(res, 200, { ok: true });
        return;
      }

      const items = await readItems();
      sendJson(res, 200, { items: publicItemsFor(req, items), storage: getStorageType() });
      return;
    }

    requireAdmin(req);

    if (req.method === "POST") {
      const body = await readJson(req);
      const items = await readItems();
      const item = normalizeItem(body);
      items.unshift(item);
      await writeItems(items);
      sendJson(res, 201, { item, items });
      return;
    }

    if (req.method === "PUT") {
      const body = await readJson(req);
      const items = await readItems();
      const index = items.findIndex((item) => item.id === body.id);
      if (index < 0) {
        const item = normalizeItem(body, { id: body.id });
        items.unshift(item);
        await writeItems(items);
        sendJson(res, 200, { item, items });
        return;
      }

      const item = normalizeItem(body, items[index]);
      items[index] = item;
      await writeItems(items);
      sendJson(res, 200, { item, items });
      return;
    }

    if (req.method === "DELETE") {
      const body = await readJson(req);
      const id = body.id || query.id;
      const items = await readItems();
      const nextItems = items.filter((item) => item.id !== id);
      if (items.length === nextItems.length) {
        sendJson(res, 200, { ok: true, items });
        return;
      }

      await writeItems(nextItems);
      sendJson(res, 200, { ok: true, items: nextItems });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    sendError(res, error);
  }
}
