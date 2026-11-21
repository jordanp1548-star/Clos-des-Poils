async function renderSeller() {
  document.title = 'Mes annonces — ' + (CFG.name || DEF.name);
  try {
    const { data: A, error } = await sb.from('animals')
      .select('*').eq('seller_id', me.id).order('id');
    if (error) throw error;

    app.innerHTML = `<h1>Mes annonces</h1>
      <p class="clos-page-intro">${A.length} annonce(s). Modifiez-les ici et répondez aux clients depuis la <a href="#/messages">messagerie</a>.</p>
      <details class="card" ${A.length ? '' : 'open'}>
        <summary>Ajouter une annonce</summary>
        <form id="clos-seller-new" class="row">
          <label>Nom<input name="name" required maxlength="60"></label>
          <label>Espèce<input name="sp" required maxlength="60"></label>
          <label>Prix (€)<input name="price" type="number" min="0" step="0.01" required></label>
          <label>Statut<select name="status"><option>À naître</option><option>En croissance</option><option>Disponible</option></select></label>
          <label>Description<textarea name="descr" rows="2"></textarea></label>
          <button type="submit">Créer l’annonce</button>
        </form>
      </details>
      ${A.map(a => `
        <div class="card">
          <form class="clos-seller-edit" data-id="${a.id}">
            <h2>${esc(a.name)} <span class="tag">${esc(a.status)}</span></h2>
            <div class="row">
              <label>Nom<input name="name" value="${esc(a.name)}" required></label>
              <label>Espèce<input name="sp" value="${esc(a.sp || '')}"></label>
              <label>Prix (€)<input name="price" type="number" min="0" step="0.01" value="${Number(a.price) || 0}"></label>
              <label>Statut<select name="status">${ST.map(s => `<option ${s === a.status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
              <label>Description<textarea name="descr" rows="2">${esc(a.descr || '')}</textarea></label>
            </div>
            <button type="submit">Enregistrer</button>
          </form>
        </div>`).join('') || '<p class="mut">Aucune annonce ne vous est encore attribuée.</p>'}`;

    $('#clos-seller-new').onsubmit = async e => {
      e.preventDefault();
      const o = Object.fromEntries(new FormData(e.target));
      o.price = Number(o.price);
      o.seller_id = me.id;
      const { error } = await sb.from('animals').insert(o);
      if (error) alert(error.message); else renderSeller();
    };

    document.querySelectorAll('.clos-seller-edit').forEach(f => f.onsubmit = async e => {
      e.preventDefault();
      const o = Object.fromEntries(new FormData(f));
      o.price = Number(o.price);
      const { error } = await sb.from('animals').update(o)
        .eq('id', f.dataset.id).eq('seller_id', me.id);
      if (error) alert(error.message); else renderSeller();
    });
  } catch (e) {
    app.innerHTML = `<h1>Mes annonces</h1><div class="card err" role="alert">Annonces indisponibles : ${esc(e.message)}</div>`;
  }
}