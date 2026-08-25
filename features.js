const rouletteResult = document.querySelector("#roulette-result");
const rouletteCategory = document.querySelector("#roulette-category");
const rouletteTitleEn = document.querySelector("#roulette-title-en");
const spinButton = document.querySelector("#spin-button");
const writeAboutButton = document.querySelector("#write-about-button");
const rouletteFilter = document.querySelector("#roulette-filter");
const rouletteCount = document.querySelector("#roulette-count");
const resetRouletteButton = document.querySelector("#reset-roulette-button");
const writerPanel = document.querySelector("#writer-panel");
const writerForm = document.querySelector("#writer-form");
const entryWork = document.querySelector("#entry-work");
const entryDate = document.querySelector("#entry-date");
const entryTitle = document.querySelector("#entry-title");
const entryBody = document.querySelector("#entry-body");
const writerStatus = document.querySelector("#writer-status");
const copyEntryButton = document.querySelector("#copy-entry-button");
const exportEntryButton = document.querySelector("#export-entry-button");
const columnList = document.querySelector("#column-list");

const draftKey = "holocron-archive-column-draft";
const selectionKey = "holocron-archive-roulette-selection";
const historyKey = "holocron-archive-roulette-history";
let rouletteWorks = [];
let columnEntries = [];
let selectedWork = null;
let drawnIds = new Set();

function localDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showStatus(message, isError = false) {
  writerStatus.textContent = message;
  writerStatus.style.color = isError ? "#ef8d8d" : "#5fd49a";
}

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
  writeAboutButton.disabled = false;
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
    writeAboutButton.disabled = true;
    updateRouletteCount();
    return;
  }

  spinButton.disabled = true;
  writeAboutButton.disabled = true;
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

function openWriterForSelection() {
  if (!selectedWork) return;
  writerPanel.open = true;
  if (selectedWork.kind === "episode") {
    const title = selectedWork.titleJa || selectedWork.titleEn;
    entryWork.value = `${selectedWork.seriesJa} ${selectedWork.label}「${title}」`;
  } else {
    entryWork.value = selectedWork.titleJa;
  }
  saveDraft();
  writerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => entryTitle.focus(), 350);
}

function readFormEntry() {
  return {
    id: `log-${entryDate.value}-${Date.now()}`,
    date: entryDate.value,
    work: entryWork.value.trim(),
    title: entryTitle.value.trim(),
    body: entryBody.value.trim()
  };
}

function saveDraft(event) {
  if (event) event.preventDefault();
  const draft = {
    date: entryDate.value,
    work: entryWork.value,
    title: entryTitle.value,
    body: entryBody.value
  };
  localStorage.setItem(draftKey, JSON.stringify(draft));
  if (event) showStatus("下書きをこの端末に保存しました。");
}

function loadDraft() {
  entryDate.value = localDateString();
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey));
    if (!draft) return;
    entryDate.value = draft.date || entryDate.value;
    entryWork.value = draft.work || "";
    entryTitle.value = draft.title || "";
    entryBody.value = draft.body || "";
  } catch (error) {
    console.warn("Saved column draft could not be loaded:", error);
  }
}

async function copyEntry() {
  if (!writerForm.reportValidity()) return;
  const entry = readFormEntry();
  const text = `# ${entry.title}\n\n${entry.date} / ${entry.work}\n\n${entry.body}`;
  try {
    await navigator.clipboard.writeText(text);
    showStatus("原稿をクリップボードへコピーしました。");
  } catch (error) {
    console.error("Column text could not be copied:", error);
    showStatus("コピーできませんでした。本文を選択してコピーしてください。", true);
  }
}

function exportEntry() {
  if (!writerForm.reportValidity()) return;
  const entry = readFormEntry();
  const data = {
    lastUpdated: entry.date,
    entries: [entry, ...columnEntries]
  };
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "columns.json";
  link.click();
  URL.revokeObjectURL(url);
  showStatus("公開用columns.jsonを作成しました。GitHubへ反映すると公開されます。");
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

  const body = document.createElement("p");
  body.className = "column-body";
  body.textContent = entry.body;
  article.append(header, body);
  return article;
}

async function loadColumns() {
  try {
    const response = await fetch("data/columns.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    columnEntries = [...data.entries].sort((a, b) => b.date.localeCompare(a.date));

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
  writeAboutButton.disabled = true;
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
  writeAboutButton.disabled = true;
  rouletteCategory.textContent = "WATCH SELECTOR";
  rouletteResult.textContent = "抽選履歴をリセットしました";
  rouletteTitleEn.textContent = "全候補が再び抽選対象になりました";
  updateRouletteCount();
}

spinButton.addEventListener("click", spinRoulette);
rouletteFilter.addEventListener("change", changeRouletteFilter);
resetRouletteButton.addEventListener("click", resetRouletteHistory);
writeAboutButton.addEventListener("click", openWriterForSelection);
writerForm.addEventListener("submit", saveDraft);
copyEntryButton.addEventListener("click", copyEntry);
exportEntryButton.addEventListener("click", exportEntry);
writerForm.addEventListener("input", () => showStatus(""));

loadDraft();
loadRoulette();
loadColumns();
