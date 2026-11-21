async function renderDev() {
  const c = CFG;
  const col = c.colors || {};
  const D = { g: '#315b45', a: '#c49a62', bg: '#f6f7f2' };
  const adv = JSON.stringify({ elev: ELEV, acompte: ACOMPTE, payinfo: PAYINFO, contracts: CT, careCats: CC, statuses: ST }, null, 1);

  app.innerHTML = `<h1>Réglages du site</h1>
    <div class="card">
      <h2>Supervision globale</h2>
      <p>Vue transversale sur toutes les conversations.</p>
      <a href="#/messages"><button type="button">Voir toutes les conversations</button></a>
    </div>
    <form id="df" class="card">
      <h3>Site</h3>
      <label>Nom<input name="name" value="${esc(c.name || '')}"></label>
      <label>Texte d’accueil<textarea name="hero" style="min-height:70px">${esc(c.hero || '')}</textarea></label>
      <div class="row">${[['g','Couleur principale'],['a','Accent'],['bg','Fond']].map(([k, l]) => `<label>${l}<input type="color" name="c_${k}" value="${col[k] || D[k]}"></label>`).join('')}</div>
      <label>CSS personnalisé<textarea name="css">${esc(c.css || '')}</textarea></label>
      <h3>Sections</h3><div id="secs"></div><button type="button" class="s" id="addsec">Ajouter une section</button>
      <h3>Personnalisation des libellés</h3>
      <label>Libellés (JSON)<textarea name="ui_labels" rows="6">${esc(JSON.stringify(c.uiLabels || {}, null, 2))}</textarea></label>
      <h3>Modèles PDF</h3>
      <label>Titre PDF<input name="pdf_title" value="${esc(c.pdf?.title || c.name || 'Le Clos des Poils')}"></label>
      <label>Sous-titre PDF<input name="pdf_subtitle" value="${esc(c.pdf?.subtitle || 'Fiche individuelle')}"></label>
      <label>Pied de page PDF<textarea name="pdf_footer" rows="2">${esc(c.pdf?.footer || 'Document de suivi édité par l’éleveur.')}</textarea></label>
      <h3>Informations légales</h3>
      ${LK.map(([k, l]) => `<label>${l}<input name="l_${k}" value="${esc(c.legal?.[k] || LEGAL_DEFAULTS[k] || '')}"></label>`).join('')}
      <h3>Avancé (JSON)</h3>
      <textarea name="adv" style="min-height:180px">${esc(adv)}</textarea><br>
      <button>Enregistrer le site</button>
    </form>
    <div class="card"><h3>Comptes</h3><div id="accts"></div></div>
    <form id="nu" class="card">
      <h3>Créer un compte</h3>
      <div class="row">
        <label>Prénom<input name="prenom" required maxlength="60"></label>
        <label>Nom<input name="nom" required maxlength="60"></label>
        <label>E-mail<input name="email" type="email" required></label>
        <label>Mot de passe<input name="password" type="password" minlength="10" required></label>
        <label>Rôle<select name="role"><option>client</option><option>seller</option><option>admin</option><option>dev</option></select></label>
        <button>Créer</button>
      </div>
    </form>
    <div class="card">
      <h3>Base de données</h3>
      <div class="row">
        <select id="tb">${['animals','payments','signatures','profiles','settings'].map(t => `<option>${t}</option>`).join('')}</select>
        <button class="s" id="ld" type="button">Charger</button>
        <button id="sv" type="button">Enregistrer</button>
      </div>
      <textarea id="rows" style="min-height:200px"></textarea>
      <div class="row"><input id="delid" placeholder="id à supprimer"><button class="d" id="dl" type="button">Supprimer</button></div>
    </div>`;

  // Sections dynamiques
  const S = (c.sections || []).map(x => ({ ...x }));
  const rs = () => {
    $('#secs').innerHTML = S.map((s, i) => `
      <div class="card" data-i="${i}">
        <div class="row">
          <label>ID<input data-f="id" value="${esc(s.id || '')}"></label>
          <label>Titre<input data-f="title" value="${esc(s.title || '')}"></label>
          <label>Emplacement<select data-f="where">${['home','client','page'].map(w => `<option ${w == s.where ? 'selected' : ''}>${w}</option>`).join('')}</select></label>
          <button type="button" class="d" data-rm="${i}">Retirer</button>
        </div>
        <textarea data-f="html">${esc(s.html || '')}</textarea>
      </div>`).join('');
    document.querySelectorAll('#secs [data-f]').forEach(el => el.oninput = () => {
      S[+el.closest('[data-i]').dataset.i][el.dataset.f] = el.value;
    });
    document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      S.splice(+b.dataset.rm, 1);
      rs();
    });
  };
  rs();
  $('#addsec').onclick = () => {
    S.push({ id: 'section' + (S.length + 1), title: 'Nouvelle section', where: 'home', html: '<p>Contenu…</p>' });
    rs();
  };

  // Sauvegarde du site
  $('#df').onsubmit = async e => {
    e.preventDefault();
    const f = e.target.elements;
    let a;
    try { a = JSON.parse(f.adv.value); } catch { return alert('JSON avancé invalide'); }
    const colors = {};
    for (const k of ['g','a','bg']) if (f['c_' + k].value !== D[k]) colors[k] = f['c_' + k].value;
    let uiLabels;
    try { uiLabels = JSON.parse(f.ui_labels.value || '{}'); } catch { return alert('JSON libellés invalide'); }
    const { error } = await sb.from('settings').upsert({
      key: 'site_config',
      value: JSON.stringify({
        ...a,
        name: f['name'].value,
        hero: f.hero.value,
        css: f.css.value,
        colors,
        sections: S,
        uiLabels,
        pdf: { title: f.pdf_title.value, subtitle: f.pdf_subtitle.value, footer: f.pdf_footer.value },
        legal: Object.fromEntries(LK.map(([k]) => [k, f['l_' + k].value || LEGAL_DEFAULTS[k]]))
      }),
      validated: true,
      validated_at: new Date().toISOString(),
      validated_by: me.id
    });
    if (error) alert(error.message);
    else { await loadCfg(); renderNav(); alert('Site enregistré'); }
  };

  // Comptes
  const accts = async () => {
    const [uRes, aRes] = await Promise.all([
      sb.from('profiles').select('*').order('created_at'),
      sb.from('animals').select('id,buyer')
    ]);
    const U = uRes.data || [];
    const A = aRes.data || [];
    $('#accts').innerHTML = '<div style="overflow-x:auto"><table><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Créé le</th><th>Animaux</th><th></th></tr>'
      + U.map(u => `<tr>
          <td>${esc((u.prenom || '') + ' ' + (u.nom || ''))}</td>
          <td>${esc(u.email || '')}</td>
          <td><select data-u="${u.id}">${['client','seller','admin','dev'].map(r => `<option ${r == u.role ? 'selected' : ''}>${r}</option>`).join('')}</select></td>
          <td>${dt(u.created_at)}</td>
          <td align="center">${A.filter(a => a.buyer == u.id).length}</td>
          <td><button class="d" data-x="${u.id}" data-e="${esc(u.email || '')}">Supprimer</button></td>
        </tr>`).join('') + '</table></div>';
    document.querySelectorAll('[data-u]').forEach(x => x.onchange = async () => {
      try { await fn('admin-set-role', { id: x.dataset.u, role: x.value }); alert('Rôle modifié'); }
      catch (e) { alert(e.message); }
      accts();
    });
    document.querySelectorAll('[data-x]').forEach(b => b.onclick = async () => {
      if (!confirm('Supprimer le compte ' + b.dataset.e + ' ?')) return;
      try { await fn('admin-delete-user', { id: b.dataset.x }); } catch (e) { alert(e.message); }
      accts();
    });
  };
  accts();

  $('#nu').onsubmit = async e => {
    e.preventDefault();
    try {
      await fn('admin-create-user', Object.fromEntries(new FormData(e.target)));
      e.target.reset();
      alert('Compte créé');
    } catch (x) { alert(x.message); }
    accts();
  };

  $('#ld').onclick = async () => {
    const { data, error } = await sb.from($('#tb').value).select('*');
    $('#rows').value = error ? error.message : JSON.stringify(data, null, 1);
  };
  $('#sv').onclick = async () => {
    let v;
    try { v = JSON.parse($('#rows').value); } catch { return alert('JSON invalide'); }
    const { error } = await sb.from($('#tb').value).upsert(v);
    alert(error ? error.message : 'Enregistré');
  };
  $('#dl').onclick = async () => {
    const t = $('#tb').value;
    if (!confirm('Supprimer cette ligne ?')) return;
    const { error } = await sb.from(t).delete().eq(t === 'settings' ? 'key' : 'id', $('#delid').value);
    alert(error ? error.message : 'Supprimé');
  };
}