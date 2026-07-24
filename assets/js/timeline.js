document.addEventListener("DOMContentLoaded", async () => {
  const r = rootPath();
  const [items, characters, planets] = await Promise.all([
    loadJSON(`${r}/assets/data/timeline.json`),
    loadJSON(`${r}/assets/data/characters.json`),
    loadJSON(`${r}/assets/data/planets.json`)
  ]);
  const cm = Object.fromEntries(characters.map(x => [x.id, x]));
  const pm = Object.fromEntries(planets.map(x => [x.id, x]));
  const wrap = document.querySelector("#timeline");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const search = document.querySelector("#timeline-search");
  const count = document.querySelector("#timeline-count");
  let currentFilter = "all";
  let query = "";

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const safeImg = (src, alt) => `<img src="${src}" alt="${esc(alt)}" onerror="this.closest('.ref-chip')?.remove()">`;
  const characterChip = id => {
    const c = cm[id];
    if (!c || !c.icon) return "";
    return `<span class="ref-chip">${safeImg(`${r}/assets/icons/pixel/characters/${c.icon}`, c.nameJa || c.name)}${esc(c.nameJa || c.name)}</span>`;
  };
  const planetChip = id => {
    const p = pm[id];
    if (!p || !p.icon) return "";
    return `<span class="ref-chip">${safeImg(`${r}/assets/icons/pixel/planets/${p.icon}`, p.nameJa || p.name)}${esc(p.nameJa || p.name)}</span>`;
  };

  function matchesEpisode(e) {
    if (!query) return true;
    const haystack = [e.titleJa,e.titleEn,e.label,e.arc,e.era,...(e.badges||[])].join(" ").toLowerCase();
    return haystack.includes(query);
  }

  function render() {
    let shownEpisodes = 0;
    const visible = items.filter(x => currentFilter === "all" || x.type === currentFilter).sort((a,b)=>a.sort-b.sort);
    wrap.innerHTML = visible.map(item => {
      const episodes = (item.episodes || []).filter(matchesEpisode);
      if (query && !episodes.length && ![item.titleJa,item.titleEn,item.summary].join(" ").toLowerCase().includes(query)) return "";
      shownEpisodes += episodes.length;
      const isCloneWars = item.id === "clone-wars";
      return `<article class="timeline-row" data-series="${esc(item.id)}">
        <div class="era">${esc(item.era)}</div><span class="node"></span>
        <div class="series-card ${query ? 'open' : ''}">
          <button type="button" class="series-toggle" aria-expanded="${query ? 'true' : 'false'}">
            <div>
              <h2>${esc(item.titleJa)}</h2><div class="en">${esc(item.titleEn)}</div>
              <p>${esc(item.summary)}</p>
              <div class="refs">${(item.mainCharacters||[]).map(characterChip).join("")}${planetChip(item.planet)}</div>
              <div class="series-meta">${(item.badges||[]).map(b=>`<span class="badge">${esc(b)}</span>`).join("")}${isCloneWars?`<span class="badge strong-badge">全${item.episodes.length}項目</span>`:""}</div>
            </div><span class="toggle-icon">＋</span>
          </button>
          <div class="episode-list">
            ${isCloneWars ? `<div class="episode-list-head"><strong>公式時系列順</strong><span>劇場版1作＋TV全133話</span></div>` : ""}
            ${episodes.map(e=>`<div class="episode-card ${e.badges?.includes('EP3 同時進行')?'ep3-concurrent':''}">
              <div class="ep-order"><strong>#${String(e.order).padStart(3,"0")}</strong><br>${esc(e.label)}<br><span>${esc(e.era||item.era)}</span></div>
              <div class="ep-title"><strong>${esc(e.titleJa)}</strong><small>${esc(e.titleEn)}</small>
                ${e.arc?`<div class="arc-label">ARC：${esc(e.arc)}</div>`:""}${e.openingQuote?`<div class="opening-quote">「${esc(e.openingQuote)}」</div>`:""}
                <div class="refs">${(e.characters||[]).slice(0,2).map(characterChip).join("")}${planetChip(e.planet)}</div>
              </div>
              <div class="episode-badges">${(e.badges||[]).map(b=>`<span class="badge">${esc(b)}</span>`).join("")}</div>
            </div>`).join("") || `<p class="empty-state">該当する記録はありません。</p>`}
          </div>
        </div></article>`;
    }).join("");
    const totalEpisodes=items.reduce((n,x)=>n+(x.episodes||[]).length,0); count.textContent = query ? `${shownEpisodes}件の記録` : `全${items.length}作品・各話${totalEpisodes}件収録`;
    wrap.querySelectorAll(".series-toggle").forEach(btn => btn.addEventListener("click", () => {
      const card = btn.closest(".series-card"); card.classList.toggle("open"); btn.setAttribute("aria-expanded",card.classList.contains("open"));
    }));
  }

  filterButtons.forEach(btn => btn.addEventListener("click",()=>{filterButtons.forEach(x=>x.classList.remove("active"));btn.classList.add("active");currentFilter=btn.dataset.filter;render();}));
  search.addEventListener("input",()=>{query=search.value.trim().toLowerCase();render();});
  render();
});