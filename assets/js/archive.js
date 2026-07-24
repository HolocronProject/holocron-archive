document.addEventListener('DOMContentLoaded', async () => {
  const grid=document.querySelector('#archive-grid'); let rows=[]; const root=rootPath();
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  function render(mode='all'){
    grid.innerHTML=rows.filter(x=>mode==='all'||x.media.includes(mode)).map(x=>`<article class="character-card">
      <div class="pixel-avatar"><img src="${root}/assets/icons/pixel/characters/${esc(x.icon)}" alt="${esc(x.name)}の16ビット風アイコン"><span class="avatar-fallback">NO IMAGE</span></div>
      <div class="card-copy"><span class="badge">${esc(x.media[0].toUpperCase())}</span><h2>${esc(x.name)}</h2><p class="english">${esc(x.en)}</p>
      <dl><dt>時代</dt><dd>${esc(x.era)}</dd><dt>所属</dt><dd>${esc(x.affiliation)}</dd>${x.master?`<dt>師匠</dt><dd>${esc(x.master)}</dd>`:''}</dl>
      <p>${esc(x.summary)}</p><div>${x.works.map(w=>`<span class="work-tag">${esc(w)}</span>`).join('')}</div></div></article>`).join('');
    grid.querySelectorAll('.pixel-avatar img').forEach(img=>{img.addEventListener('error',()=>img.parentElement.classList.add('missing'));});
  }
  try{rows=await loadJSON(`${root}/assets/data/characters.json`);render();document.querySelector('.filter-row').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.filter)})}
  catch(e){grid.innerHTML='<p>データを読み込めませんでした。</p>'}
});