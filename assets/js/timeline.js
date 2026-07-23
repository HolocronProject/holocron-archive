document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("timeline-list");
  const search = document.getElementById("timeline-search");
  const buttons = [...document.querySelectorAll(".filter-btn")];
  if (!list) return;
  let activeFilter = "すべて";
  let data = [];
  try {
    const response = await fetch("../assets/data/timeline.json");
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    list.innerHTML = '<p class="notice">タイムラインデータを読み込めませんでした。Live Serverで開いてください。</p>';
    return;
  }
  const render = () => {
    const q = (search?.value || "").toLowerCase();
    const filtered = data.filter(item => {
      const typeMatch = activeFilter === "すべて" || item.type.includes(activeFilter);
      const textMatch = !q || `${item.title} ${item.era} ${item.type} ${item.detail}`.toLowerCase().includes(q);
      return typeMatch && textMatch;
    });
    list.innerHTML = filtered.map(item => `
      <article class="timeline-card">
        <div class="timeline-era">${item.era}</div>
        <h3>${item.title}</h3>
        <div class="meta"><span class="chip">${item.type}</span><span class="chip">ARCHIVE ${String(item.no).padStart(2,"0")}</span></div>
        ${item.detail ? `<p class="detail">${item.detail}</p>` : ""}
      </article>`).join("") || '<p class="notice">該当する記録はありません。</p>';
  };
  buttons.forEach(button => button.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    render();
  }));
  search?.addEventListener("input", render);
  render();
});
