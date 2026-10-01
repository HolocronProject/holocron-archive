(() => {
  const gallery = document.getElementById("portrait-grid");
  const preview = document.getElementById("home-portrait-grid");
  if (!gallery && !preview) return;

  const pageSize = 18;
  const statusLabel = { candidate: "完成候補", review: "要確認" };

  function makeCard(person, compact = false) {
    const card = document.createElement("article");
    card.className = compact ? "portrait-card portrait-card-compact" : "portrait-card";
    const imageLink = document.createElement("a");
    imageLink.className = "portrait-image-link";
    imageLink.href = `assets/characters/${person.image}`;
    imageLink.target = "_blank";
    imageLink.rel = "noopener noreferrer";
    imageLink.setAttribute("aria-label", `${person.name}の画像を拡大`);
    const image = document.createElement("img");
    image.src = imageLink.href;
    image.alt = `${person.name}の非公式ファンアート`;
    image.width = 320;
    image.height = 320;
    image.loading = "lazy";
    image.decoding = "async";
    imageLink.append(image);

    const body = document.createElement("div");
    body.className = "portrait-card-body";
    const heading = document.createElement("h3");
    heading.textContent = person.name;
    const badge = document.createElement("span");
    badge.className = `portrait-badge portrait-badge-${person.status}`;
    badge.textContent = statusLabel[person.status] || "要確認";
    body.append(heading, badge);
    if (person.source) {
      const source = document.createElement("a");
      source.className = "portrait-source";
      source.href = person.source;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.textContent = "公式資料 ↗";
      body.append(source);
    }
    card.append(imageLink, body);
    return card;
  }

  function initGallery(people) {
    const search = document.getElementById("portrait-search");
    const status = document.getElementById("portrait-status");
    const count = document.getElementById("portrait-count");
    const more = document.getElementById("portrait-more");
    let filtered = people;
    let shown = 0;

    function appendPage() {
      const next = filtered.slice(shown, shown + pageSize);
      gallery.append(...next.map((person) => makeCard(person)));
      shown += next.length;
      more.hidden = shown >= filtered.length;
    }

    function filter() {
      const query = search.value.trim().normalize("NFKC").toLowerCase();
      filtered = people.filter((person) =>
        (status.value === "all" || person.status === status.value) &&
        (!query || `${person.name} ${person.romanizedName || ""} ${person.image}`.normalize("NFKC").toLowerCase().includes(query))
      );
      count.textContent = `${filtered.length}名の肖像画`;
      shown = 0;
      gallery.replaceChildren();
      if (filtered.length) {
        appendPage();
      } else {
        const empty = document.createElement("p");
        empty.className = "character-loading";
        empty.textContent = "該当する人物はいません。";
        gallery.append(empty);
        more.hidden = true;
      }
    }

    search.addEventListener("input", filter);
    status.addEventListener("change", filter);
    more.addEventListener("click", appendPage);
    filter();
  }

  function initPreview(people) {
    const featured = [
      "portraits/bo-keevil-v1.webp", "portraits/frisk-v1.webp", "portraits/j-3di-v1.webp",
      "portraits/lx-1-v1.webp", "portraits/rieve-v1.webp", "portraits/aeosian-queen-v1.webp"
    ];
    const cards = featured.map((image) => people.find((person) => person.image === image)).filter(Boolean);
    preview.replaceChildren(...(cards.length ? cards : people.slice(0, 6)).map((person) => makeCard(person, true)));
    const count = document.getElementById("home-portrait-count");
    if (count) count.textContent = `${people.length}名の肖像画を掲載中`;
  }

  fetch("data/character-portraits.json")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((people) => {
      if (!Array.isArray(people)) throw new Error("Invalid portrait data");
      if (gallery) initGallery(people);
      if (preview) initPreview(people);
    })
    .catch(() => {
      const error = document.createElement("p");
      error.className = "portrait-loading";
      error.textContent = "肖像画を読み込めませんでした。再読み込みしてください。";
      if (gallery) gallery.replaceChildren(error.cloneNode(true));
      if (preview) preview.replaceChildren(error);
    });
})();
