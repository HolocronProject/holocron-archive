"use strict";

(() => {
  const map = document.querySelector("#planet-map");
  const detail = document.querySelector("#planet-detail");
  const search = document.querySelector("#planet-search");
  const media = document.querySelector("#planet-media");
  const count = document.querySelector("#planet-count");
  const groups = [["movies", "映画の世界"], ["animation", "アニメの世界"], ["live-action", "ドラマの世界"], ["games", "ゲームの世界"]];
  let records = [];
  let selected = "";
  let failures = [];
  const normalize = text => text.normalize("NFKC").toLocaleLowerCase().trim();
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function selectPlanet(planet, focus = false) {
    selected = planet.id;
    const title = el("h3", planet.nameJa);
    title.id = "planet-title";
    title.tabIndex = -1;
    const list = el("ul");
    planet.appearances.forEach(work => list.append(el("li", work)));
    const sources = el("p", undefined, "planet-sources");
    planet.sources.forEach((url, index) => {
      const link = el("a", "公式資料 " + (index + 1) + " ↗");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      sources.append(link);
    });
    detail.replaceChildren(el("p", planet.kind + " / WORLD RECORD", "section-kicker"), title,
      el("p", planet.nameEn, "planet-english"), el("p", planet.summary, "planet-summary"),
      el("h4", "登場作品（確認済みの一部）"), list, sources, el("small", "資料確認日： " + planet.verifiedAt));
    map.querySelectorAll("[data-planet]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.planet === selected));
    });
    if (focus) title.focus({ preventScroll: true });
    if (focus && window.matchMedia("(max-width: 800px)").matches) detail.scrollIntoView({ behavior: "auto", block: "start" });
  }
  function render() {
    const term = normalize(search.value);
    const aliases = { rebels: "反乱者たち", "clone wars": "クローン・ウォーズ", ahsoka: "アソーカ", andor: "キャシアン・アンドー", mandalorian: "マンダロリアン" };
    const query = aliases[term] || term;
    const visible = records.filter(p => (media.value === "all" || p.media.includes(media.value)) &&
      normalize([p.nameJa, p.nameEn, ...p.appearances].join(" ")).includes(query));
    map.replaceChildren();
    count.textContent = visible.length + "件表示 / " + records.length + "件収録（全件照合は未完了）" +
      (failures.length ? " — 読み込み失敗：" + failures.join("、") + "。再読み込みしてください。" : "");
    if (!visible.length) map.append(el("p", "一致する星がありません。検索語や作品の種類を変えてください。", "atlas-empty"));
    groups.forEach(([group, label]) => {
      const items = visible.filter(p => p.group === group);
      if (!items.length) return;
      const section = el("section", undefined, "star-sector");
      section.append(el("h3", label));
      const nodes = el("div", undefined, "planet-nodes");
      items.forEach(p => {
        const button = el("button", undefined, "planet-node");
        button.type = "button";
        button.dataset.planet = p.id;
        button.setAttribute("aria-pressed", String(selected === p.id));
        button.setAttribute("aria-controls", "planet-detail");
        const orb = el("span", undefined, "planet-orb");
        orb.setAttribute("aria-hidden", "true");
        button.append(orb, el("span", p.nameJa), el("small", p.nameEn));
        button.addEventListener("click", () => selectPlanet(p, true));
        nodes.append(button);
      });
      section.append(nodes);
      map.append(section);
    });
    if (visible.length && !visible.some(p => p.id === selected)) selectPlanet(visible[0]);
    if (!visible.length) {
      selected = "";
      const title = el("h3", "該当する記録なし");
      title.id = "planet-title";
      detail.replaceChildren(title, el("p", "検索をクリアすると、収録済みの星に戻れます。"));
    }
  }
  search.addEventListener("input", render);
  media.addEventListener("change", render);
  document.querySelector("#planet-reset").addEventListener("click", () => {
    search.value = ""; media.value = "all"; render(); search.focus();
  });
  async function load() {
    const results = await Promise.allSettled(groups.map(async ([group]) => {
      const response = await fetch("data/planets/" + group + ".json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (!Array.isArray(data) || data.some(p => !p.id || !p.nameJa || !p.nameEn || !p.summary ||
        !Array.isArray(p.media) || !Array.isArray(p.appearances) || !Array.isArray(p.sources) ||
        p.sources.some(url => !url.startsWith("https://www.starwars.com/")))) throw new Error("Invalid planet data");
      return data.map(p => ({ ...p, group }));
    }));
    results.forEach((result, index) => {
      if (result.status === "fulfilled") records.push(...result.value);
      else failures.push(groups[index][1]);
    });
    render();
    if (!records.length) {
      count.textContent = "記録を読み込めませんでした。接続を確認して、ページを再読み込みしてください。";
      map.replaceChildren();
    }
  }
  load();
})();
