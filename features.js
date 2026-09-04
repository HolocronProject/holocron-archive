const rouletteResult = document.querySelector("#roulette-result");
const rouletteCategory = document.querySelector("#roulette-category");
const rouletteTitleEn = document.querySelector("#roulette-title-en");
const spinButton = document.querySelector("#spin-button");
const rouletteFilter = document.querySelector("#roulette-filter");
const rouletteCount = document.querySelector("#roulette-count");
const resetRouletteButton = document.querySelector("#reset-roulette-button");
const columnList = document.querySelector("#column-list");

const selectionKey = "holocron-archive-roulette-selection";
const historyKey = "holocron-archive-roulette-history";
let rouletteWorks = [];
let columnEntries = [];
let selectedWork = null;
let drawnIds = new Set();

function displayRouletteWork(work, recordResult = false) {
  selectedWork = work;
  const episodeLabel = work.label ? ` / ${work.label}` : "";
  rouletteCategory.textContent = `${work.category}${episodeLabel}`;
  if (work.kind === "episode") {
    rouletteResult.textContent = work.seriesJa;
    const title = work.titleJa || work.titleEn;
    rouletteTitleEn.textContent = work.titleJa && work.titleEn ? `${title} / ${work.titleEn}` : title;
  } else {
    rouletteResult.textContent = work.titleJa;
    rouletteTitleEn.textContent = work.titleEn;
  }
  localStorage.setItem(selectionKey, JSON.stringify(work));
  if (recordResult) {
    drawnIds.add(work.id);
    localStorage.setItem(historyKey, JSON.stringify([...drawnIds]));
    updateRouletteCount();
  }
}

function categoryWorks() {
  const category = rouletteFilter.value;
  return category === "all"
    ? rouletteWorks
    : rouletteWorks.filter((work) => work.category === category);
}

function availableWorks() {
  return categoryWorks().filter((work) => !drawnIds.has(work.id));
}

function randomWork() {
  const candidates = availableWorks();
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function spinRoulette() {
  if (!rouletteWorks.length) return;

  const finalWork = randomWork();
  if (!finalWork) {
    rouletteCategory.textContent = "ARCHIVE COMPLETE";
    rouletteResult.textContent = "このカテゴリは全候補抽選済み";
    rouletteTitleEn.textContent = "もう一度始める場合は抽選履歴をリセットしてください";
    updateRouletteCount();
    return;
  }

  spinButton.disabled = true;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    displayRouletteWork(finalWork, true);
    return;
  }

  let turns = 0;
  const timer = window.setInterval(() => {
    const preview = turns >= 15 ? finalWork : randomWork();
    rouletteCategory.textContent = preview.category;
    rouletteResult.textContent = preview.titleJa;
    rouletteTitleEn.textContent = preview.titleEn;
    turns += 1;

    if (turns >= 16) {
      window.clearInterval(timer);
      displayRouletteWork(finalWork, true);
    }
  }, 85);
}

function createColumnCard(entry) {
  const article = document.createElement("article");
  article.className = "column-card";

  const header = document.createElement("div");
  header.className = "column-card-header";
  const heading = document.createElement("div");
  const date = document.createElement("time");
  date.dateTime = entry.date;
  date.textContent = entry.date.replaceAll("-", ".");
  const title = document.createElement("h3");
  title.textContent = entry.title;
  heading.append(date, title);

  const work = document.createElement("span");
  work.className = "column-work";
  work.textContent = entry.work;
  header.append(heading, work);

  let artwork = null;
  if (entry.image) {
    artwork = document.createElement("figure");
    artwork.className = "column-artwork";
    const image = document.createElement("img");
    image.src = entry.image;
    image.alt = entry.imageAlt || "";
    image.loading = "lazy";
    image.decoding = "async";
    artwork.append(image);
  }

  const body = document.createElement("div");
  body.className = "column-body";
  if (columnList.dataset.preview === "true") {
    const paragraph = document.createElement("p");
    const plainText = entry.body.replace(/\s+/g, " ").trim();
    paragraph.textContent = `${plainText.slice(0, 180)}${plainText.length > 180 ? "…" : ""}`;
    const more = document.createElement("a");
    more.className = "column-more";
    more.href = "columns.html";
    more.textContent = "続きを読む →";
    body.append(paragraph, more);
  } else {
    entry.body
      .trim()
      .split(/\n\s*\n/)
      .filter(Boolean)
      .forEach((text) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        body.append(paragraph);
      });
  }
  article.append(header);
  if (artwork) article.append(artwork);
  article.append(body);
  return article;
}

async function loadColumns() {
  try {
    const response = await fetch("data/columns.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    columnEntries = [...data.entries].sort((a, b) => b.date.localeCompare(a.date));
    const limit = Number.parseInt(columnList.dataset.limit, 10);
    if (Number.isFinite(limit) && limit > 0) columnEntries = columnEntries.slice(0, limit);

    if (!columnEntries.length) {
      const empty = document.createElement("p");
      empty.className = "column-empty";
      empty.textContent = "まだ記録はありません。最初の一本をルーレットで選んでみよう。";
      columnList.replaceChildren(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    columnEntries.forEach((entry) => fragment.append(createColumnCard(entry)));
    columnList.replaceChildren(fragment);
  } catch (error) {
    console.error("Columns could not be loaded:", error);
    const message = document.createElement("p");
    message.className = "column-empty";
    message.textContent = "コラムを読み込めませんでした。";
    columnList.replaceChildren(message);
  }
}

async function loadRoulette() {
  try {
    const response = await fetch("data/roulette.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    rouletteWorks = data.works;
    loadRouletteHistory();
    updateRouletteCount();

    const saved = JSON.parse(localStorage.getItem(selectionKey));
    if (saved && rouletteWorks.some((work) => work.id === saved.id)) displayRouletteWork(saved);
  } catch (error) {
    console.error("Roulette data could not be loaded:", error);
    rouletteResult.textContent = "ルーレットを読み込めませんでした";
    spinButton.disabled = true;
  }
}

function loadRouletteHistory() {
  try {
    const savedIds = JSON.parse(localStorage.getItem(historyKey));
    const validIds = new Set(rouletteWorks.map((work) => work.id));
    drawnIds = new Set(Array.isArray(savedIds) ? savedIds.filter((id) => validIds.has(id)) : []);
    localStorage.setItem(historyKey, JSON.stringify([...drawnIds]));
  } catch (error) {
    console.warn("Roulette history could not be loaded:", error);
    drawnIds = new Set();
  }
}

function updateRouletteCount() {
  const total = categoryWorks().length;
  const remaining = availableWorks().length;
  rouletteCount.textContent = `残り ${remaining} / ${total}候補`;
  spinButton.disabled = remaining === 0;
  resetRouletteButton.disabled = drawnIds.size === 0;
}

function changeRouletteFilter() {
  selectedWork = null;
  rouletteCategory.textContent = "WATCH SELECTOR";
  rouletteResult.textContent = "運命の作品を選択";
  rouletteTitleEn.textContent = "抽選対象を選んでルーレットを回してください";
  updateRouletteCount();
}

function resetRouletteHistory() {
  if (!drawnIds.size) return;
  if (!window.confirm("これまでの抽選履歴をすべてリセットしますか？")) return;
  drawnIds.clear();
  localStorage.removeItem(historyKey);
  selectedWork = null;
  rouletteCategory.textContent = "WATCH SELECTOR";
  rouletteResult.textContent = "抽選履歴をリセットしました";
  rouletteTitleEn.textContent = "全候補が再び抽選対象になりました";
  updateRouletteCount();
}

if (spinButton && rouletteFilter && resetRouletteButton) {
  spinButton.addEventListener("click", spinRoulette);
  rouletteFilter.addEventListener("change", changeRouletteFilter);
  resetRouletteButton.addEventListener("click", resetRouletteHistory);
  loadRoulette();
}

if (columnList) loadColumns();
