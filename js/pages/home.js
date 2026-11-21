async function renderHome() {
  document.title = 'Accueil — ' + (CFG.name || DEF.name);
  app.innerHTML = `
    <div class="clos-hero">
      <div class="clos-kicker">Bienvenue au Clos des Poils</div>
      <h1>Des animaux, du soin et de belles rencontres.</h1>
      <p>${esc(CFG.hero || DEF.hero)}</p>
      <div class="clos-actions">
        <button type="button" id="clos-jump">Découvrir les annonces</button>
        ${!me
          ? '<a href="#/compte"><button class="s" type="button">Créer un compte / Se connecter</button></a>'
          : '<a href="#/messages"><button class="s" type="button">Ouvrir ma messagerie</button></a>'}
      </div>
    </div>
    <div class="clos-section-head">
      <div>
        <div class="clos-kicker" style="color:var(--g)">Nos animaux</div>
        <h2 id="annonces">Les animaux disponibles</h2>
        <p class="clos-page-intro">Parcourez les annonces par famille animale et ouvrez chaque fiche pour découvrir ses informations.</p>
      </div>
    </div>
    <div class="clos-filter">
      <input id="clos-animal-search" placeholder="Rechercher un animal, une race…" aria-label="Rechercher">
      <select id="clos-animal-category" aria-label="Filtrer par famille"><option value="">Toutes les familles</option></select>
    </div>
    <div id="clos-animal-results"><p class="mut">Chargement des annonces…</p></div>
  `;

  if (!me) {
    app.insertAdjacentHTML('beforeend', `
      <section class="card" style="margin-top:24px">
        <h2>Un renseignement ?</h2>
        <p>Vous pouvez consulter les annonces librement. Pour poser une question à un vendeur, créer une demande ou suivre une réservation, créez votre espace client.</p>
        <div class="clos-actions">
          <a href="#/compte"><button type="button">Créer mon compte client</button></a>
          <a href="#/contact"><button class="s" type="button">Contacter l’élevage</button></a>
        </div>
      </section>
    `);
  }

  const jumpBtn = $('#clos-jump');
  if (jumpBtn) jumpBtn.onclick = () => {
    const el = $('#annonces');
    if (el) el.scrollIntoView({ behavior:'smooth' });
  };

  const host = $('#clos-animal-results');
  try {
    const { data, error } = await sb.from('animals')
      .select('id,name,emoji,sp,descr,born,remise,price,sex,status,photos,data')
      .eq('status','Disponible')
      .order('id',{ascending:false});
    if (error) throw error;
    const animals = data || [];
    const cats = [...new Set(animals.map(a => catOf(a.sp)[0]))];
    const catSel = $('#clos-animal-category');
    if (catSel) catSel.insertAdjacentHTML('beforeend', cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join(''));

    const render = () => {
      const q = ($('#clos-animal-search')?.value || '').toLowerCase().trim();
      const cat = $('#clos-animal-category')?.value || '';
      const filtered = animals.filter(a =>
        (!cat || catOf(a.sp)[0] === cat) &&
        (!q || [a.name, a.sp, a.descr, a.data?.profile?.race].join(' ').toLowerCase().includes(q))
      );
      if (!filtered.length) {
        host.innerHTML = '<div class="clos-empty">Aucun animal ne correspond à cette recherche.</div>';
        return;
      }
      const groups = {};
      filtered.forEach(a => {
        const [c, emoji] = catOf(a.sp);
        (groups[c] ??= { emoji, items: [] }).items.push(a);
      });
      if (window.A11Y) A11Y.announce(filtered.length + ' annonce(s) affichée(s)');
      host.innerHTML = Object.entries(groups).map(([c, g]) => `
        <section class="clos-category">
          <div class="clos-category-head">
            <span style="font-size:1.7rem">${g.emoji}</span>
            <h2 style="margin:0">${esc(c)}</h2>
            <span class="clos-count">${g.items.length} annonce(s)</span>
          </div>
          <div class="clos-animal-grid">
            ${g.items.map(a => {
              const r = a.data?.profile || {};
              const photo = a.photos?.length ? a.photos[a.photos.length-1] : null;
              const meta = [a.sp, r.race, a.sex, a.born ? 'Né(e) le ' + dt(a.born) : null].filter(Boolean);
              return `<article class="card clos-animal">
                ${photo
                  ? `<img class="clos-animal-photo" src="${esc(photo.url)}" alt="${esc(a.name)}" loading="lazy">`
                  : `<div class="clos-animal-photo" style="display:grid;place-items:center;font-size:4rem" aria-hidden="true">${g.emoji}</div>`}
                <div class="clos-animal-body">
                  <div><span class="tag">Disponible</span></div>
                  <h3 style="margin:0">${esc(a.name)}</h3>
                  ${a.descr ? `<p>${esc(a.descr)}</p>` : ''}
                  <div class="clos-animal-meta">${meta.map(x => `<span>${esc(x)}</span>`).join('')}</div>
                  ${r.caractere ? `<p><b>Caractère :</b> ${esc(r.caractere)}</p>` : ''}
                  ${(r.disponibilite_reelle || r.disponibilite_prevue || a.remise)
                    ? `<p class="mut">Disponible à partir du ${dt(r.disponibilite_reelle||r.disponibilite_prevue||a.remise)}</p>`
                    : ''}
                  <div class="clos-price">${eur(a.price)}</div>
                  <details>
                    <summary>Voir la fiche détaillée</summary>
                    <div style="padding-top:10px">
                      ${r.habitudes ? `<p><b>Socialisation :</b> ${esc(r.habitudes)}</p>` : ''}
                      ${r.alimentation ? `<p><b>Alimentation :</b> ${esc(r.alimentation)}</p>` : ''}
                      ${r.couleur ? `<p><b>Robe / couleur :</b> ${esc(r.couleur)}</p>` : ''}
                      ${r.poids ? `<p><b>Poids :</b> ${esc(r.poids)}</p>` : ''}
                      ${r.conseils ? `<p><b>Conseils :</b> ${esc(r.conseils)}</p>` : ''}
                      ${r.pere_portee ? `<p><b>Père :</b> ${esc(r.pere_portee)}</p>` : ''}
                      ${r.mere_portee ? `<p><b>Mère :</b> ${esc(r.mere_portee)}</p>` : ''}
                    </div>
                  </details>
                  ${(!me || prof?.role === 'client')
                    ? `<button type="button" data-reserve="${a.id}" style="width:100%" aria-label="Demander une réservation pour ${esc(a.name)}">${me ? 'Demander une réservation' : 'Se connecter pour réserver'}</button>`
                    : ''}
                  <a href="${me ? '#/messages' : '#/compte'}">
                    <button type="button" class="s" style="width:100%" aria-label="${me ? 'Poser une question sur ' : 'Se connecter pour contacter au sujet de '}${esc(a.name)}">${me ? 'Poser une question' : 'Se connecter pour contacter'}</button>
                  </a>
                </div>
              </article>`;
            }).join('')}
          </div>
        </section>
      `).join('');
    };

    const searchEl = $('#clos-animal-search');
    const catEl = $('#clos-animal-category');
    host.onclick = e => {
      const b = e.target.closest('[data-reserve]');
      if (b) openReserveDialog(animals.find(x => x.id == b.dataset.reserve));
    };
    if (searchEl) searchEl.oninput = render;
    if (catEl) catEl.onchange = render;
    render();

  } catch (e) {
    host.innerHTML = `
      <div class="clos-empty" style="border-color:#a83c35;color:#a83c35">
        <b>Impossible de charger les annonces.</b><br>
        ${esc(e.message || e)}<br><br>
        <button type="button" onclick="location.reload()">Réessayer</button>
      </div>`;
  }
}