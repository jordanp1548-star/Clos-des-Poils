async function renderSeller() {
  document.title = 'Espace vendeur — ' + (CFG.name || DEF.name);
  try {
    const { data: A, error } = await sb.from('animals')
      .select('*').eq('seller_id', me.id).order('id');
    if (error) throw error;

    app.innerHTML = `<h1>Espace vendeur</h1>
      <p>Gérez vos annonces et répondez aux clients.</p>
      <div class="row">
        <div class="card" style="flex:1"><b>${A.length}</b><br><span class="mut">Annonce(s)</span></div>
        <div class="card" style="flex:1"><a href="#/messages">Ouvrir ma messagerie</a></div>
      </div>
      <div class="card">
        <h2>Ajouter une annonce</h2>
        <form id="clos-seller-new" class="row">
          <label>Nom<input name="name" required maxlength="60"></label>
          <label>Espèce<input name="sp" required maxlength="60"></label>
          <label>Prix (€)<input name="price" type="number" min="0" step="0.01" required></label>
          <label>Statut<select name="status"><option>À naître</option><option>En croissance</option><option>Disponible</option></select></label>
          <label>Description<textarea name="descr" rows="2"></textarea></label>
          <button type="submit">Créer l’annonce</button>
        </form>
      </div>
      <h2>Mes annonces</h2>
      ${A.map(a => `
        <div class="card">
          <form class="clos-seller-edit" data-id="${a.id}">
            <h3>${esc(a.name)} <span class="tag">${esc(a.status)}</span></h3>
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
    app.innerHTML = `<h1>Espace vendeur</h1><div class="card err">Espace vendeur indisponible : ${esc(e.message)}</div>`;
  }
}