async function renderHome() {
  document.title = 'Accueil — ' + (CFG.name || DEF.name);
  app.innerHTML = `
    <section class="clos-hero clos-hero-home">
      <h1>Des animaux, du soin et de belles rencontres</h1>
      <p>${esc(CFG.hero || DEF.hero)}</p>
      <div class="clos-actions">
        <button type="button" id="clos-jump">Découvrir les annonces</button>
        ${!me
          ? '<a href="#/compte"><button class="s" type="button">Créer un compte / Se connecter</button></a>'
          : '<a href="#/messages"><button class="s" type="button">Ouvrir ma messagerie</button></a>'}
      </div>
    </section>
    <div class="clos-section-head">
      <div>
        <h2 id="annonces">Les animaux disponibles</h2>
        <p class="clos-page-intro">Choisissez une famille ou tapez un nom, une race, une espèce. « Plus d’informations » ouvre la fiche complète.</p>
      </div>
    </div>
    <div class="clos-filter" role="search">
      <input id="clos-animal-search" type="search" list="clos-suggest" autocomplete="off"
             placeholder="Rechercher un nom, une race, une espèce…" aria-label="Rechercher un animal">
      <datalist id="clos-suggest"></datalist>
      <select id="clos-animal-category" aria-label="Filtrer par famille">
        <option value="">Toutes les familles</option>
      </select>
    </div>
    <div id="clos-animal-results"><p class="mut" role="status">Chargement des annonces…</p></div>
  `;

  if (!me) {
    app.insertAdjacentHTML('beforeend', `
      <section class="card" style="margin-top:24px">
        <h2>Un renseignement ?</h2>
        <p>Vous pouvez consulter les annonces librement. Pour demander une réservation, poser une question à un vendeur ou suivre votre dossier, créez votre espace client.</p>
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
    if (el) { el.scrollIntoView({ behavior: 'smooth' }); }
  };

  const host = $('#clos-animal-results');
  try {
    const { data, error } = await sb.from('animals')
      .select('id,name,emoji,sp,descr,born,remise,price,sex,status,photos,data')
      .eq('status', 'Disponible')
      .order('id', { ascending: false });
    if (error) throw error;
    const animals = data || [];
    const canReserve = !me || prof?.role === 'client';

    /* Liste déroulante : toutes les familles, avec le nombre d'annonces */
    const count = {};
    animals.forEach(a => { const c = catOf(a.sp)[0]; count[c] = (count[c] || 0) + 1; });
    const catSel = $('#clos-animal-category');
    if (catSel) catSel.insertAdjacentHTML('beforeend', FAMILIES.map(([n, e]) =>
      `<option value="${esc(n)}">${e} ${esc(n)} (${count[n] || 0})</option>`).join(''));

    /* Suggestions de recherche : familles, espèces, races, noms */
    const sug = new Set(FAMILIES.map(f => f[0]));
    animals.forEach(a => {
      [a.name, a.sp, a.data?.profile?.race, a.data?.profile?.couleur].forEach(v => { if (v && String(v).trim()) sug.add(String(v).trim()); });
    });
    const dl = $('#clos-suggest');
    if (dl) dl.innerHTML = [...sug].sort((x, y) => x.localeCompare(y, 'fr'))
      .map(v => `<option value="${esc(v)}"></option>`).join('');

    const card = (a, emoji) => {
      const r = a.data?.profile || {};
      const photo = a.photos?.length ? a.photos[a.photos.length - 1] : null;
      const dispo = availabilityOf(a);
      return `<article class="card clos-animal">
        ${photo
          ? `<img class="clos-animal-photo" src="${esc(photo.url)}" alt="Photo de ${esc(a.name)}" loading="lazy">`
          : `<div class="clos-animal-photo" style="display:grid;place-items:center;font-size:4rem" aria-hidden="true">${emoji}</div>`}
        <div class="clos-animal-body">
          <h4>${esc(a.name)}</h4>
          <div class="clos-price">${a.price ? eur(a.price) : 'Prix sur demande'}</div>
          <dl class="clos-facts">
            <div><dt>Race</dt><dd>${esc(r.race || a.sp || 'Non précisée')}</dd></div>
            <div><dt>Né(e) le</dt><dd>${a.born ? dt(a.born) : 'À confirmer'}</dd></div>
            <div><dt>Disponible dès le</dt><dd>${dispo ? dt(dispo) : 'À confirmer'}</dd></div>
          </dl>
          <div class="clos-card-actions">
            <button type="button" class="s" data-more="${a.id}" aria-haspopup="dialog" aria-label="Plus d’informations sur ${esc(a.name)}">Plus d’informations</button>
            ${canReserve
              ? `<button type="button" data-reserve="${a.id}" aria-label="${me ? 'Demander une réservation pour ' : 'Se connecter pour réserver '}${esc(a.name)}">${me ? 'Demander une réservation' : 'Se connecter pour réserver'}</button>`
              : ''}
          </div>
        </div>
      </article>`;
    };

    const render = () => {
      const q = ($('#clos-animal-search')?.value || '').toLowerCase().trim();
      const cat = $('#clos-animal-category')?.value || '';
      const filtered = animals.filter(a =>
        (!cat || catOf(a.sp)[0] === cat) &&
        (!q || [a.name, a.sp, a.descr, a.data?.profile?.race, a.data?.profile?.couleur, catOf(a.sp)[0]]
          .join(' ').toLowerCase().includes(q))
      );
      if (window.A11Y) A11Y.announce(filtered.length + ' annonce(s) affichée(s)');
      if (!filtered.length) {
        host.innerHTML = '<div class="clos-empty">' + (cat && !q
          ? 'Aucune annonce dans la famille « ' + esc(cat) + ' » pour le moment.'
          : 'Aucun animal ne correspond à cette recherche.') + '</div>';
        return;
      }
      const groups = {};
      filtered.forEach(a => {
        const [c, emoji] = catOf(a.sp);
        (groups[c] ??= { emoji, items: [] }).items.push(a);
      });
      const order = FAMILIES.map(f => f[0]);
      host.innerHTML = Object.entries(groups)
        .sort((x, y) => order.indexOf(x[0]) - order.indexOf(y[0]))
        .map(([c, g]) => `
          <section class="clos-category" aria-label="${esc(c)}">
            <div class="clos-category-head">
              <span style="font-size:1.7rem" aria-hidden="true">${g.emoji}</span>
              <h3 style="margin:0">${esc(c)}</h3>
              <span class="clos-count">${g.items.length} annonce(s)</span>
            </div>
            <div class="clos-animal-grid">${g.items.map(a => card(a, g.emoji)).join('')}</div>
          </section>`).join('');
    };

    host.onclick = e => {
      const more = e.target.closest('[data-more]');
      if (more) return openAnimalDialog(animals.find(x => x.id == more.dataset.more));
      const res = e.target.closest('[data-reserve]');
      if (res) return openReserveDialog(animals.find(x => x.id == res.dataset.reserve));
    };
    const searchEl = $('#clos-animal-search');
    const catEl = $('#clos-animal-category');
    if (searchEl) searchEl.oninput = render;
    if (catEl) catEl.onchange = render;
    render();

  } catch (e) {
    host.innerHTML = `
      <div class="clos-empty" role="alert" style="border-color:#a83c35;color:#a83c35">
        <b>Impossible de charger les annonces.</b><br>
        ${esc(e.message || e)}<br><br>
        <button type="button" onclick="location.reload()">Réessayer</button>
      </div>`;
  }
}
