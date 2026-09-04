const timeline = document.querySelector("#timeline");
const workCount = document.querySelector("#work-count");

function formatDate(work) {
  if (work.dateLabel) return work.dateLabel;
  if (work.startYear === work.endYear) return `${work.startYear} ${work.era}`;
  return `${work.startYear}–${work.endYear} ${work.era}`;
}

function createDetailList(work) {
  const detailList = document.createElement("dl");
  detailList.className = "card-details";
  const fields = [
    ["作中年代", formatDate(work)],
    [work.episodes ? "公開期間" : "公開年", `${work.releaseYear}年`],
    ["区分", work.category]
  ];

  fields.forEach(([label, value]) => {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    wrapper.append(term, description);
    detailList.append(wrapper);
  });
  return detailList;
}

function shortenSummary(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text;
  const sample = text.slice(0, maxLength + 1);
  const sentenceEnd = sample.lastIndexOf("。");
  if (sentenceEnd >= 55) return sample.slice(0, sentenceEnd + 1);
  return `${text.slice(0, maxLength).trim()}…`;
}

function createEpisodeList(work) {
  const section = document.createElement("section");
  section.className = "episode-section";
  section.setAttribute("aria-label", `${work.titleJa} エピソード一覧`);

  const header = document.createElement("div");
  header.className = "episode-list-header";
  const heading = document.createElement("h3");
  heading.textContent = work.episodeOrderLabel || "エピソード順";
  const count = document.createElement("span");
  count.textContent = work.includesMovie
    ? `劇場版＋TV全${work.episodeCount}話`
    : `全${work.episodeCount}話`;
  header.append(heading, count);

  const list = document.createElement("ol");
  list.className = "episode-list";
  work.episodes.forEach((episode, index) => {
    const item = document.createElement("li");
    item.className = "episode-item";
    const hasNarrative = Boolean(episode.lesson || episode.summary);
    const episodeCard = hasNarrative ? document.createElement("details") : document.createElement("div");
    episodeCard.className = "episode-card";
    const row = hasNarrative ? document.createElement("summary") : document.createElement("div");
    row.className = "episode-row";

    const order = document.createElement("span");
    order.className = "episode-order";
    order.textContent = String(index + 1).padStart(3, "0");

    const number = document.createElement("span");
    number.className = "episode-number";
    if (episode.type === "movie") {
      number.textContent = "劇場版";
    } else {
      const season = document.createElement("span");
      season.textContent = `SEASON ${episode.season}`;
      const episodeNumber = document.createElement("strong");
      episodeNumber.textContent = `第${episode.episode}話`;
      number.append(season, episodeNumber);
    }

    const titles = document.createElement("span");
    titles.className = "episode-titles";
    const titleJa = document.createElement("strong");
    titleJa.textContent = episode.titleJa;
    const titleEn = document.createElement("span");
    titleEn.lang = "en";
    titleEn.textContent = episode.titleEn;
    titles.append(titleJa, titleEn);

    row.append(order, number, titles);

    if (hasNarrative) {
      const chevron = document.createElement("span");
      chevron.className = "episode-chevron";
      chevron.setAttribute("aria-hidden", "true");
      row.append(chevron);
    }

    episodeCard.append(row);

    if (hasNarrative) {
      const narrative = document.createElement("div");
      narrative.className = "episode-narrative";

      if (episode.lesson) {
        const lesson = document.createElement("p");
        lesson.className = "episode-lesson";
        const label = document.createElement("span");
        label.textContent = "今回の教訓";
        lesson.append(label, document.createTextNode(episode.lesson));
        narrative.append(lesson);
      }

      if (episode.summary) {
        const episodeSummary = document.createElement("p");
        episodeSummary.className = "episode-summary";
        episodeSummary.textContent = shortenSummary(episode.summary);
        narrative.append(episodeSummary);
      }

      episodeCard.append(narrative);
    }
    item.append(episodeCard);
    list.append(item);
  });

  section.append(header, list);
  return section;
}

function createWorkNarrative(work) {
  if (!work.summary) return null;

  const section = document.createElement("section");
  section.className = "work-narrative";
  const label = document.createElement("span");
  label.textContent = work.summaryLabel || "オープニング要約";
  const copy = document.createElement("p");
  copy.textContent = work.summary;
  section.append(label, copy);
  return section;
}

function createTimelineItem(work) {
  const article = document.createElement("article");
  article.className = "timeline-item";

  const date = document.createElement("time");
  date.className = "timeline-date";
  date.textContent = formatDate(work);

  const details = document.createElement("details");
  details.className = "timeline-card";
  if (work.episodes) details.classList.add("has-episodes");

  const summary = document.createElement("summary");
  summary.className = "card-summary";

  const titles = document.createElement("span");
  const titleJa = document.createElement("span");
  titleJa.className = "title-ja";
  titleJa.textContent = work.titleJa;
  const titleEn = document.createElement("span");
  titleEn.className = "title-en";
  titleEn.lang = "en";
  titleEn.textContent = work.titleEn;
  titles.append(titleJa, titleEn);

  const meta = document.createElement("span");
  meta.className = "card-meta";
  const releaseYear = document.createElement("span");
  releaseYear.textContent = work.episodes ? `全${work.episodeCount}話` : work.releaseYear;
  const chevron = document.createElement("span");
  chevron.className = "chevron";
  chevron.setAttribute("aria-hidden", "true");
  meta.append(releaseYear, chevron);
  summary.append(titles, meta);

  details.append(summary, createDetailList(work));
  const narrative = createWorkNarrative(work);
  if (narrative) details.append(narrative);
  if (work.episodes) details.append(createEpisodeList(work));
  article.append(date, details);
  return article;
}

async function loadTimeline() {
  try {
    const seriesFiles = [
      "data/acolyte.json",
      "data/maul-shadow-lord.json",
      "data/rebels.json",
      "data/mandalorian.json",
      "data/ahsoka.json",
      "data/skeleton-crew.json"
    ];
    const responses = await Promise.all([
      fetch("data/movies.json"),
      fetch("data/clone-wars.json"),
      ...seriesFiles.map((file) => fetch(file))
    ]);
    const failedResponse = responses.find((response) => !response.ok);
    if (failedResponse) throw new Error(`Timeline HTTP ${failedResponse.status}`);

    const [moviesData, cloneWarsData, ...seriesData] = await Promise.all(
      responses.map((response) => response.json())
    );
    const works = [...moviesData.works];
    const cloneWarsWork = works.find((work) => work.id === "the-clone-wars-film");
    if (!cloneWarsWork) throw new Error("Clone Wars timeline card is missing");

    cloneWarsWork.titleJa = "スター・ウォーズ：クローン・ウォーズ";
    cloneWarsWork.titleEn = "Star Wars: The Clone Wars";
    cloneWarsWork.endYear = 19;
    cloneWarsWork.releaseYear = "2008–2020";
    cloneWarsWork.category = "劇場版＋TVアニメ";
    cloneWarsWork.episodes = [...cloneWarsData.items].sort(
      (a, b) => a.chronologicalOrder - b.chronologicalOrder
    );
    cloneWarsWork.episodeOrderLabel = "公式時系列順";
    cloneWarsWork.includesMovie = true;
    cloneWarsWork.episodeCount = cloneWarsWork.episodes.filter(
      (episode) => episode.type === "episode"
    ).length;

    seriesData.forEach(({ work, episodes }) => {
      works.push({
        ...work,
        episodes: [...episodes].sort(
          (a, b) => a.season - b.season || a.episode - b.episode
        )
      });
    });

    works.sort((a, b) => a.timelineOrder - b.timelineOrder);
    const fragment = document.createDocumentFragment();
    works.forEach((work) => fragment.append(createTimelineItem(work)));

    timeline.replaceChildren(fragment);
    const episodeTotal = works.reduce(
      (total, work) => total + (work.episodeCount || 0),
      0
    );
    if (workCount) workCount.textContent = `${works.length}作品・${episodeTotal}話`;
  } catch (error) {
    console.error("Timeline data could not be loaded:", error);
    const message = document.createElement("p");
    message.className = "error";
    message.textContent = "タイムラインを読み込めませんでした。ページを再読み込みしてください。";
    timeline.replaceChildren(message);
    if (workCount) workCount.textContent = "--";
  }
}

if (timeline) loadTimeline();
