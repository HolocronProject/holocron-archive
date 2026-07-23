const state = { items: [], cloneWars: [], format: "すべて", query: "" };

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[ch]);
}

async function loadData() {
  const [timelineResponse, cloneWarsResponse] = await Promise.all([
    fetch("../assets/data/timeline.json"),
    fetch("../assets/data/clone-wars.json")
  ]);
  if (!timelineResponse.ok || !cloneWarsResponse.ok) {
    throw new Error("JSONデータを読み込めませんでした。Live Serverで開いてください。");
  }
  state.items = (await timelineResponse.json()).items;
  state.cloneWars = (await cloneWarsResponse.json()).items;
}

function renderFilters() {
  const formats = ["すべて", ...new Set(state.items.map(item => item.format))];
  $("#formatFilters").innerHTML = formats.map(format => `
    <button class="filter ${format === state.format ? "active" : ""}" data-format="${escapeHtml(format)}">
      ${escapeHtml(format)}
    </button>
  `).join("");
  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      state.format = button.dataset.format;
      renderFilters();
      renderTimeline();
    });
  });
}

function visibleItems() {
  const q = state.query.trim().toLowerCase();
  return state.items.filter(item => {
    const formatMatch = state.format === "すべて" || item.format === state.format;
    const haystack = [item.era, item.title, item.format, item.granularity, item.note].join(" ").toLowerCase();
    return formatMatch && (!q || haystack.includes(q));
  });
}

function badgeMarkup(badge) {
  return `<span class="cw-badge cw-badge--${escapeHtml(badge.key)}">${escapeHtml(badge.label)}</span>`;
}

function cloneWarsMarkup() {
  let previousArc = "";
  const rows = state.cloneWars.map(item => {
    const arcHeader = item.arc && item.arc !== previousArc
      ? `<div class="cw-arc-heading"><span>STORY ARC</span>${escapeHtml(item.arc)}</div>`
      : "";
    previousArc = item.arc;
    return `
      ${arcHeader}
      <article class="cw-row ${item.episode3Concurrent ? "cw-row--episode3" : ""}">
        <div class="cw-order">#${String(item.chronologicalOrder).padStart(3, "0")}</div>
        <div class="cw-code">${escapeHtml(item.code)}</div>
        <div class="cw-title-block">
          <div class="cw-ja">${escapeHtml(item.titleJa)}</div>
          <div class="cw-en">${escapeHtml(item.titleEn)}</div>
          <div class="cw-badges">${(item.badges || []).map(badgeMarkup).join("")}</div>
        </div>
      </article>
    `;
  }).join("");

  return `
    <div class="cw-panel">
      <div class="cw-legend">
        <span class="cw-badge cw-badge--arc">STORY ARC</span>
        <span class="cw-badge cw-badge--final-season">FINAL SEASON</span>
        <span class="cw-badge cw-badge--episode3">EP3 同時進行</span>
      </div>
      <div class="cw-grid">${rows}</div>
    </div>
  `;
}

function renderTimeline() {
  const items = visibleItems();
  $("#stats").textContent = `${items.length} / ${state.items.length} RECORDS　・　CLONE WARS ${state.cloneWars.length} RECORDS`;
  $("#timelineList").innerHTML = items.length ? items.map(item => `
    <article class="timeline-card" data-id="${escapeHtml(item.id)}">
      <div class="era">${escapeHtml(item.era)}</div>
      <div class="card-main">
        <h2 class="card-title">${escapeHtml(item.title)}</h2>
        <div class="meta">
          <span class="badge">${escapeHtml(item.format)}</span>
          <span class="badge">${escapeHtml(item.granularity)}</span>
          ${item.status === "announced" ? `<span class="badge">公開予定</span>` : ""}
        </div>
        ${item.note ? `<p class="note">${escapeHtml(item.note)}</p>` : ""}
      </div>
      ${item.seriesKey === "clone-wars" ? `<button class="expand" aria-label="クローン・ウォーズ全話を展開">＋</button>` : `<span></span>`}
      ${item.seriesKey === "clone-wars" ? cloneWarsMarkup() : ""}
    </article>
  `).join("") : `<div class="empty">該当する記録がありません。</div>`;

  document.querySelectorAll(".timeline-card .expand").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".timeline-card");
      card.classList.toggle("open");
      button.textContent = card.classList.contains("open") ? "－" : "＋";
    });
  });
}

async function init() {
  try {
    await loadData();
    renderFilters();
    renderTimeline();
    $("#searchInput").addEventListener("input", event => {
      state.query = event.target.value;
      renderTimeline();
    });
  } catch (error) {
    $("#timelineList").innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  }
}
init();
