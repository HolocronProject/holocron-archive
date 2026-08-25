const rouletteResult = document.querySelector("#roulette-result");
const rouletteCategory = document.querySelector("#roulette-category");
const rouletteTitleEn = document.querySelector("#roulette-title-en");
const spinButton = document.querySelector("#spin-button");
const writeAboutButton = document.querySelector("#write-about-button");
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
let rouletteWorks = [];
let columnEntries = [];
let selectedWork = null;

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

function displayRouletteWork(work) {
  selectedWork = work;
  rouletteCategory.textContent = work.category;
  rouletteResult.textContent = work.titleJa;
  rouletteTitleEn.textContent = work.titleEn;
  writeAboutButton.disabled = false;
  localStorage.setItem(selectionKey, JSON.stringify(work));
}

function randomWork() {
  return rouletteWorks[Math.floor(Math.random() * rouletteWorks.length)];
}

function spinRoulette() {
  if (!rouletteWorks.length) return;

  spinButton.disabled = true;
  writeAboutButton.disabled = true;
  const finalWork = randomWork();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    displayRouletteWork(finalWork);
    spinButton.disabled = false;
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
      displayRouletteWork(finalWork);
      spinButton.disabled = false;
    }
  }, 85);
}

function openWriterForSelection() {
  if (!selectedWork) return;
  writerPanel.open = true;
  entryWork.value = selectedWork.titleJa;
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

    const saved = JSON.parse(localStorage.getItem(selectionKey));
    if (saved && rouletteWorks.some((work) => work.id === saved.id)) displayRouletteWork(saved);
  } catch (error) {
    console.error("Roulette data could not be loaded:", error);
    rouletteResult.textContent = "ルーレットを読み込めませんでした";
    spinButton.disabled = true;
  }
}

spinButton.addEventListener("click", spinRoulette);
writeAboutButton.addEventListener("click", openWriterForSelection);
writerForm.addEventListener("submit", saveDraft);
copyEntryButton.addEventListener("click", copyEntry);
exportEntryButton.addEventListener("click", exportEntry);
writerForm.addEventListener("input", () => showStatus(""));

loadDraft();
loadRoulette();
loadColumns();
