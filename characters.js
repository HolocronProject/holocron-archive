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

  const collectionRoot = document.getElementById("character-collections");
  const collectionCount = document.getElementById("collection-count");
  const collections = [
    ["dark", "暗黒面に関わる人物"],
    ["rebels", "反乱勢力"],
    ["mandalore", "マンダロリアン"],
    ["underworld", "賞金稼ぎ・裏社会"],
    ["droid", "ドロイド"],
    ["leaders", "政治・軍の指導者"]
  ];

  function makeCollectionGroup(category, title, people) {
    const section = document.createElement("section");
    section.className = "collection-group";
    section.id = `collection-${category}`;
    section.append(makeText("h3", "", title));
    const list = document.createElement("ul");
    list.className = "collection-list";
    people.forEach((person) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = person.source;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.append(makeText("strong", "", person.name), makeText("span", "", person.detail));
      item.append(link);
      list.append(item);
    });
    section.append(list);
    return section;
  }

  indexData.then((people) => {
    if (!Array.isArray(people)) throw new Error("Invalid collection data");
    collectionRoot.replaceChildren(...collections.map(([category, title]) =>
      makeCollectionGroup(category, title, people.filter((person) => person.category === category))));
    collectionCount.textContent = `${people.length}名を収録`;
  }).catch(() => {
    collectionRoot.replaceChildren(makeText("p", "character-loading", "一覧を読み込めませんでした。時間をおいて再読み込みしてください。"));
  });
})();
