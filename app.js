const timeline = document.querySelector("#timeline");
const workCount = document.querySelector("#work-count");

function formatDate(work) {
  if (work.startYear === work.endYear) return `${work.startYear} ${work.era}`;
  return `${work.startYear}–${work.endYear} ${work.era}`;
}

function createTimelineItem(work) {
  const article = document.createElement("article");
  article.className = "timeline-item";

  const date = document.createElement("time");
  date.className = "timeline-date";
  date.textContent = formatDate(work);

  const details = document.createElement("details");
  details.className = "timeline-card";

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
  releaseYear.textContent = work.releaseYear;
  const chevron = document.createElement("span");
  chevron.className = "chevron";
  chevron.setAttribute("aria-hidden", "true");
  meta.append(releaseYear, chevron);
  summary.append(titles, meta);

  const detailList = document.createElement("dl");
  detailList.className = "card-details";
  const fields = [
    ["作中年代", formatDate(work)],
    ["公開年", `${work.releaseYear}年`],
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

  details.append(summary, detailList);
  article.append(date, details);
  return article;
}

async function loadTimeline() {
  try {
    const response = await fetch("data/movies.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const works = [...data.works].sort((a, b) => a.timelineOrder - b.timelineOrder);
    const fragment = document.createDocumentFragment();
    works.forEach((work) => fragment.append(createTimelineItem(work)));

    timeline.replaceChildren(fragment);
    workCount.textContent = `${works.length}作品`;
  } catch (error) {
    console.error("Timeline data could not be loaded:", error);
    const message = document.createElement("p");
    message.className = "error";
    message.textContent = "タイムラインを読み込めませんでした。ページを再読み込みしてください。";
    timeline.replaceChildren(message);
    workCount.textContent = "--";
  }
}

loadTimeline();
