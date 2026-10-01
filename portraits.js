(() => {
  const gallery = document.getElementById("portrait-grid");
  const preview = document.getElementById("home-portrait-grid");
  if (!gallery && !preview) return;

  const pageSize = 18;
  const statusLabel = { published: "紹介中", candidate: "完成候補", review: "要確認" };
  const featuredImages = [
    "portraits/hunter-v1.webp",
    "portraits/bo-katan-kryze-v1.webp",
    "portraits/padme-amidala-v1.webp",
    "portraits/count-dooku-v1.webp",
    "portraits/cassian-andor-v1.webp",
    "portraits/jyn-erso-v1.webp",
    "portraits/cal-kestis-v1.webp",
    "portraits/fennec-shand-v1.webp",
    "portraits/hondo-ohnaka-v1.webp",
    "portraits/maz-kanata-v1.webp",
    "portraits/k-2so-v1.webp",
    "portraits/ig-11-v1.webp",
    "portraits/chopper-v1.webp",
    "portraits/saw-gerrera-v1.webp",
    "portraits/bail-organa-v1.webp",
    "portraits/shin-hati-v1.webp",
    "portraits/baylan-skoll-v1.webp",
    "portraits/kay-vess-v1.webp"
  ];

  function prioritize(people) {
    const byImage = new Map(people.map((person) => [person.image, person]));
    const featured = featuredImages.map((image) => byImage.get(image)).filter(Boolean);
    const featuredSet = new Set(featuredImages);
    return [...featured, ...people.filter((person) => !featuredSet.has(person.image))];
  }

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
    const all = document.getElementById("portrait-all");
    const ordered = prioritize(people);
    const featuredSet = new Set(featuredImages);
    let expanded = false;
    let filtered = ordered;
    let shown = 0;

    function appendPage() {
      const next = filtered.slice(shown, shown + pageSize);
      gallery.append(...next.map((person) => makeCard(person)));
      shown += next.length;
      more.hidden = shown >= filtered.length;
    }

    function filter() {
      const query = search.value.trim().normalize("NFKC").toLowerCase();
      const matches = ordered.filter((person) =>
        (status.value === "all" || person.status === status.value) &&
        (!query || `${person.name} ${person.romanizedName || ""} ${person.image}`.normalize("NFKC").toLowerCase().includes(query))
      );
      const featuredOnly = !expanded && !query && status.value === "all";
      filtered = featuredOnly ? matches.filter((person) => featuredSet.has(person.image)) : matches;
      count.textContent = featuredOnly
        ? `主要${filtered.length}名を表示（全${people.length}名）`
        : `${filtered.length}名の肖像画`;
      all.hidden = !featuredOnly;
      shown = 0;
      gallery.replaceChildren();
      if (filtered.length) {
        appendPage();
        if (expanded && !query && status.value === "all") appendPage();
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
    all.addEventListener("click", () => { expanded = true; filter(); });
    filter();
  }

  function initPreview(people) {
    const rex = {
      name: "レックス",
      romanizedName: "Rex",
      image: "rex.png",
      status: "published",
      source: "https://www.starwars.com/databank/clone-captain-rex"
    };
    const homeImages = featuredImages.slice(0, 5);
    const cards = [rex, ...homeImages.map((image) => people.find((person) => person.image === image)).filter(Boolean)];
    preview.replaceChildren(...(cards.length ? cards : people.slice(0, 6)).map((person) => makeCard(person, true)));
    const count = document.getElementById("home-portrait-count");
    if (count) count.textContent = `主要キャラクターから紹介。全${people.length}名の下書きも閲覧できます。`;
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
