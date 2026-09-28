(() => {
  const grid = document.getElementById("character-grid");
  const count = document.getElementById("character-count");
  if (!grid || !count) return;

  function makeText(tagName, className, value) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = value;
    return element;
  }

  function makeCharacterCard(character) {
    const card = document.createElement("article");
    card.className = "character-card";
    card.id = character.id;

    const picture = document.createElement("div");
    picture.className = "character-picture";
    const image = document.createElement("img");
    image.src = `assets/characters/${character.id}.png`;
    image.alt = `${character.nameJa}の非公式ファンアート`;
    image.width = 160;
    image.height = 160;
    image.loading = "lazy";
    image.decoding = "async";
    picture.append(image);

    const content = document.createElement("div");
    content.className = "character-copy";
    const heading = document.createElement("div");
    heading.className = "character-name";
    heading.append(
      makeText("h3", "", character.nameJa),
      makeText("span", "character-name-en", character.nameEn)
    );
    const meta = document.createElement("p");
    meta.className = "character-meta";
    meta.append(
      makeText("span", "", character.role),
      makeText("span", "", character.unit)
    );
    if (character.designation) {
      meta.append(makeText("span", "character-designation", character.designation));
    }
    const summary = makeText("p", "character-summary", character.summary);
    const source = document.createElement("a");
    source.className = "character-source";
    source.href = character.source;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "公式Databankで確認 ↗";
    content.append(heading, meta, summary, source);
    card.append(picture, content);
    return card;
  }

  function readJson(path) {
    return fetch(path).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
  }

  const cloneData = readJson("data/clone-characters.json");
  const jediData = readJson("data/jedi-characters.json");
  const candidateData = readJson("data/clone-candidates.json");
  const indexData = readJson("data/character-index.json");

  cloneData
    .then((characters) => {
      if (!Array.isArray(characters)) throw new Error("Invalid character data");
      grid.replaceChildren(...characters.map(makeCharacterCard));
      count.textContent = `${characters.length}名を収録`;
    })
    .catch(() => {
      grid.replaceChildren(makeText("p", "character-loading", "キャラクターを読み込めませんでした。時間をおいて再読み込みしてください。"));
    });

  const jediRoot = document.getElementById("jedi-groups");
  const jediCount = document.getElementById("jedi-count");
  if (!jediRoot || !jediCount) return;

  function makeJediGroup(group) {
    const section = document.createElement("section");
    section.className = "jedi-group";
    section.id = `jedi-${group.id}`;
    section.append(makeText("h3", "", group.title));
    const list = document.createElement("ul");
    list.className = "jedi-list";
    group.characters.forEach((character) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = character.source;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.append(
        makeText("strong", "", character.name),
        makeText("span", "", character.detail)
      );
      item.append(link);
      list.append(item);
    });
    section.append(list);
    return section;
  }

  jediData
    .then((data) => {
      if (!Array.isArray(data.groups)) throw new Error("Invalid Jedi data");
      jediRoot.replaceChildren(...data.groups.map(makeJediGroup));
      const total = data.groups.reduce((count, group) => count + group.characters.length, 0);
      jediCount.textContent = `${total}名を選出`;
    })
    .catch(() => {
      jediRoot.replaceChildren(makeText("p", "character-loading", "ジェダイの一覧を読み込めませんでした。時間をおいて再読み込みしてください。"));
    });

  const upcomingList = document.getElementById("character-upcoming-list");
  candidateData.then((characters) => {
    if (!Array.isArray(characters)) throw new Error("Invalid candidate data");
    upcomingList.replaceChildren(...characters.map((character) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = character.source;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = character.name;
      item.append(link);
      return item;
    }));
  }).catch(() => {
    upcomingList.replaceChildren(makeText("li", "character-loading", "候補を読み込めませんでした。"));
  });

  const search = document.getElementById("directory-search");
  const category = document.getElementById("directory-category");
  const era = document.getElementById("directory-era");
  const results = document.getElementById("directory-results");
  const status = document.getElementById("directory-status");
  const total = document.getElementById("directory-total");
  const more = document.getElementById("directory-more");
  const categoryLabels = {
    clone: "クローン", jedi: "ジェダイと元ジェダイ", dark: "暗黒面",
    rebels: "反乱勢力", mandalore: "マンダロリアン", underworld: "裏社会",
    droid: "ドロイド", leaders: "政治・軍"
  };
  const eraLabels = {
    "high-republic": "ハイ・リパブリック後期", republic: "共和国末期・クローン大戦",
    empire: "帝国期・反乱", "new-republic": "新共和国期", sequel: "ファースト・オーダー期"
  };
  let directory = [];
  let visible = 24;

  function makeDirectoryItem(person) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = person.link;
    if (person.link.startsWith("https://")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    link.append(
      makeText("strong", "", person.name),
      makeText("span", "directory-detail", person.detail),
      makeText("span", "directory-tags", `${categoryLabels[person.category]} · ${eraLabels[person.era]}${person.hasImage ? " · 画像あり" : ""}`)
    );
    item.append(link);
    return item;
  }

  function renderDirectory() {
    const query = search.value.trim().normalize("NFKC").toLocaleLowerCase("ja");
    const filtered = directory.filter((person) => {
      if (category.value && person.category !== category.value) return false;
      if (era.value && person.era !== era.value) return false;
      return !query || `${person.name} ${person.detail} ${categoryLabels[person.category]} ${eraLabels[person.era]}`
        .normalize("NFKC").toLocaleLowerCase("ja").includes(query);
    });
    const shown = filtered.slice(0, visible);
    results.replaceChildren(...(shown.length
      ? shown.map(makeDirectoryItem)
      : [makeText("li", "directory-empty", "該当する人物がいません。条件を変えてください。")]));
    status.textContent = `${filtered.length}名が該当 · ${shown.length}名を表示`;
    more.hidden = shown.length >= filtered.length;
  }

  [search, category, era].forEach((control) => {
    control.addEventListener(control === search ? "input" : "change", () => {
      visible = 24;
      renderDirectory();
    });
  });
  more.addEventListener("click", () => {
    visible += 24;
    renderDirectory();
  });

  Promise.all([cloneData, candidateData, jediData, indexData]).then(([clones, candidates, jedi, extras]) => {
    if (!Array.isArray(clones) || !Array.isArray(candidates) || !Array.isArray(jedi.groups) || !Array.isArray(extras)) {
      throw new Error("Invalid directory data");
    }
    directory = [
      ...clones.map((person) => ({ name: person.nameJa, detail: `${person.role}／${person.unit}`, category: "clone", era: "republic", link: `#${person.id}`, hasImage: true })),
      ...candidates.map((person) => ({ name: person.name, detail: person.detail, category: "clone", era: "republic", link: person.source })),
      ...jedi.groups.flatMap((group) => group.characters.map((person) => ({ name: person.name, detail: person.detail, category: "jedi", era: group.id, link: person.source }))),
      ...extras.map((person) => ({ ...person, link: person.source }))
    ];
    total.textContent = `${directory.length}名を収録`;
    renderDirectory();
  }).catch(() => {
    total.textContent = "読み込みエラー";
    results.replaceChildren(makeText("li", "directory-empty", "一覧を読み込めませんでした。時間をおいて再読み込みしてください。"));
  });
})();
