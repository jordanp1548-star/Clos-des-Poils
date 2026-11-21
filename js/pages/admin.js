async function renderAdmin() {
  document.title = 'Espace éleveur — ' + (CFG.name || DEF.name);
  try {
    const [aRes, uRes, pRes, sRes] = await Promise.all([
      sb.from('animals').select('*').order('id'),
      sb.from('profiles').select('id,prenom,nom,role').in('role', ['client','seller']),
      sb.from('payments').select('*').order('d'),
      sb.from('signatures').select('*')
    ]);
    const A = aRes.data || [];
    const U = uRes.data || [];
    const P = pRes.data || [];
    const S = sRes.data || [];

    app.innerHTML = `<h1>Espace éleveur</h1>
      <div class="card">
        <h2>Messagerie et demandes clients</h2>
        <p>Consultez toutes les demandes, répondez aux clients et attribuez une conversation à un vendeur.</p>
        <a href="#/messages"><button type="button">Ouvrir toutes les conversations</button></a>
      </div>
      <button id="new" type="button">Ajouter un animal</button><br><br>`
      + A.map(a => adminAnimalCard(a, U, P, S)).join('');

    $('#new').onclick = async () => {
      const { error } = await sb.from('animals').insert({ name: 'Nouvel animal', status: 'À naître' });
      if (error) alert(error.message); else renderAdmin();
    };

    bindAdminForms(A, U);
  } catch (e) {
    app.innerHTML = '<div class="card err">Erreur espace éleveur : ' + esc(e.message) + '</div>';
  }
}

function adminAnimalCard(a, U, P, S) {
  const photos = a.photos || [];
  const lastPhoto = photos.length ? photos[photos.length - 1] : null;
  const galerieEdit = photos.map((ph, i) => `
    <div style="margin-bottom:10px;border:1px solid var(--line);padding:8px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:10px">
        <img src="${esc(ph.url)}" style="width:60px;height:60px;border-radius:8px;object-fit:cover" alt="">
        <div><b>${dt(ph.date)}</b> — ${esc(ph.comment)}</div>
      </div>
      <button type="button" class="d del-photo" data-animal="${a.id}" data-i="${i}" style="padding:2px 8px;font-size:0.8rem">Supprimer</button>
    </div>`).join('');

  const r = a.data?.profile || {};
  const v = k => esc(r[k] || '');
  const ML = { name: 60, sp: 40, descr: 500, sex: 20 };
  const inp = (a, k, l) => `<label>${l}<input name="${k}" maxlength="${ML[k] || 200}" value="${esc(a[k] || '')}"></label>`;

  return `<details class="card" data-id="${a.id}" ${OPEN == a.id ? 'open' : ''}>
    <summary style="display:flex;align-items:center;gap:10px">
      ${lastPhoto ? `<img src="${esc(lastPhoto.url)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover" alt="">` : '<span>—</span>'}
      <b>${esc(a.name)}</b> <span class="tag">${esc(a.status)}</span>
    </summary>
    <button type="button" class="s no-print" onclick="window.print()" style="float:right">Imprimer</button>

    <form class="ef">
      <div class="row">${inp(a,'name','Nom')}${inp(a,'sp','Espèce')}${inp(a,'descr','Description')}${inp(a,'sex','Sexe')}</div>
      <div class="row">
        <label>Naissance<input type="date" name="born" value="${a.born || ''}"></label>
        <label>Remise<input type="date" name="remise" value="${a.remise || ''}"></label>
        <label>Prix €<input type="number" name="price" value="${a.price || 0}"></label>
        <label>Statut<select name="status">${ST.map(s => `<option ${s == a.status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
        <label>Vendeur<select name="seller_id"><option value="">— Aucun —</option>${U.filter(u => u.role === 'seller').map(u => `<option value="${u.id}" ${u.id == a.seller_id ? 'selected' : ''}>${esc((u.prenom||'')+' '+(u.nom||''))}</option>`).join('')}</select></label>
        <label>Acquéreur<select name="buyer"><option value="">—</option>${U.filter(u => u.role === 'client').map(u => `<option value="${u.id}" ${u.id == a.buyer ? 'selected' : ''}>${esc((u.prenom||'')+' '+(u.nom||''))}</option>`).join('')}</select></label>
      </div>
      <hr style="margin:18px 0">
      <h3>Identification</h3>
      <div class="row">
        <label>Animal identifié ?<select name="p_identifie" class="ident-select"><option ${r.identifie === 'Non' ? 'selected' : ''}>Non</option><option ${r.identifie === 'Oui' ? 'selected' : ''}>Oui</option></select></label>
        <label class="ident-detail" style="display:${r.identifie === 'Oui' ? 'block' : 'none'}">Type<select name="p_identification_type"><option value="">—</option>${['Puce électronique','Tatouage','Bague','Autre'].map(x => `<option ${r.identification_type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="ident-detail" style="display:${r.identifie === 'Oui' ? 'block' : 'none'}">Numéro<input name="p_identification_numero" value="${v('identification_numero')}"></label>
        <label class="ident-detail" style="display:${r.identifie === 'Oui' ? 'block' : 'none'}">Date<input type="date" name="p_identification_date" value="${v('identification_date')}"></label>
      </div>
      <h3>Informations générales</h3>
      <div class="row">
        <label>Race<input name="p_race" value="${v('race')}"></label>
        <label>Couleur<input name="p_couleur" value="${v('couleur')}"></label>
        <label>Poids<input name="p_poids" value="${v('poids')}" placeholder="Ex. 850 g"></label>
      </div>
      <h3>Disponibilité</h3>
      <div class="row">
        <label>Estimée<input type="date" name="p_disponibilite_prevue" value="${v('disponibilite_prevue')}"></label>
        <label>Réelle<input type="date" name="p_disponibilite_reelle" value="${v('disponibilite_reelle')}"></label>
        <label>Départ prévu<input type="date" name="p_depart_prevu" value="${v('depart_prevu')}"></label>
      </div>
      <h3>Santé</h3>
      <div class="row">
        <label>Dernier contrôle<input type="date" name="p_dernier_controle" value="${v('dernier_controle')}"></label>
        <label>Antécédents<input name="p_antecedents" value="${v('antecedents')}"></label>
      </div>
      <label>Observations santé<textarea name="p_notes_sante" rows="2" style="min-height:70px">${v('notes_sante')}</textarea></label>
      <h3>Portée</h3>
      <div class="row">
        <label>N° portée<input name="p_numero_portee" value="${v('numero_portee')}"></label>
        <label>Père<input name="p_pere_portee" value="${v('pere_portee')}"></label>
        <label>Mère<input name="p_mere_portee" value="${v('mere_portee')}"></label>
        <label>Date mise bas<input type="date" name="p_date_mise_bas" value="${v('date_mise_bas')}"></label>
      </div>
      <h3>Caractère et habitudes</h3>
      <label>Caractère<textarea name="p_caractere" rows="2" style="min-height:70px">${v('caractere')}</textarea></label>
      <label>Habitudes<textarea name="p_habitudes" rows="2" style="min-height:70px">${v('habitudes')}</textarea></label>
      <label>Alimentation<textarea name="p_alimentation" rows="2" style="min-height:70px">${v('alimentation')}</textarea></label>
      <button>Enregistrer la fiche</button>
    </form>

    <h3>Actualités en photos</h3>
    <div style="background:var(--bg);padding:10px;border-radius:8px;margin-bottom:15px">${galerieEdit || '<span class="mut">Aucune photo.</span>'}</div>
    <form class="uf" data-id="${a.id}" style="background:var(--card);border:1px dashed var(--g);padding:10px;border-radius:8px;margin-bottom:20px">
      <h4>Ajouter une photo</h4>
      <div class="row">
        <label>Fichier<input type="file" name="file" accept="image/*" required style="padding:5px"></label>
        <label>Commentaire<input name="comment" placeholder="Ex: Première sortie" required></label>
        <button type="submit" class="s">Mettre en ligne</button>
      </div>
    </form>

    <h3>Soins</h3>${careHtml(a, true)}
    <form class="cf">
      <div class="row">
        <select name="k">${Object.entries(CC).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select>
        <input name="n" placeholder="Nom du soin" required>
        <label>Date<input type="date" name="d" required></label>
        <label>Rappel<input type="date" name="rd"></label>
        <button class="s" type="submit">Ajouter un soin</button>
      </div>
    </form>

    <h3>Paiements</h3>
    ${P.filter(x => x.animal_id == a.id).map(x => `
      <div class="card pay-item" data-payid="${esc(x.id)}" data-animal="${a.id}" style="margin:8px 0;padding:10px">
        <div class="row">
          <label>Libellé<input data-pay="l" value="${esc(x.l || '')}"></label>
          <label>Montant (€)<input data-pay="a" type="number" min="0" step="0.01" value="${esc(x.a)}"></label>
          <label>Date<input data-pay="d" type="date" value="${esc(x.d || '')}"></label>
          <button type="button" class="s pay-save">Enregistrer</button>
          <button type="button" class="d pay-delete">Supprimer</button>
        </div>
      </div>`).join('') || '<div class="mut">Aucun paiement enregistré.</div>'}
    <form class="pf">
      <div class="row">
        <input name="l" placeholder="Libellé" required>
        <input type="number" min="0" step="0.01" name="a" placeholder="Montant €" required>
        <input type="date" name="d" required>
        <button class="s" type="submit">Enregistrer un paiement</button>
      </div>
    </form>

    <h3>Signatures</h3>
    ${S.filter(x => x.animal_id == a.id).map(x => `<div>✔ ${esc(x.contract_key)} — ${esc(x.name)} le ${new Date(x.at).toLocaleString('fr-FR')}</div>`).join('') || '<div class="mut">Aucune</div>'}
  </details>`;
}

function bindAdminForms(A, U) {
  // Formulaire fiche animal
  document.querySelectorAll('.ef').forEach(f => f.onsubmit = async e => {
    e.preventDefault();
    const o = Object.fromEntries(new FormData(f));
    const a = A.find(x => x.id == f.closest('[data-id]').dataset.id);
    const d = a.data || {};
    const profile = d.profile || {};
    Object.keys(o).filter(k => k.startsWith('p_')).forEach(k => {
      profile[k.slice(2)] = o[k];
      delete o[k];
    });
    d.profile = profile;
    o.data = d;
    o.buyer = o.buyer || null;
    o.price = +o.price;
    o.born = o.born || null;
    o.remise = o.remise || null;
    o.sex = o.sex || null;
    const { error } = await sb.from('animals').update(o).eq('id', a.id);
    if (error) alert(error.message);
    else { OPEN = a.id; renderAdmin(); }
  });

  document.querySelectorAll('.ident-select').forEach(sel => sel.onchange = () => {
    const form = sel.closest('form');
    form.querySelectorAll('.ident-detail').forEach(el => {
      el.style.display = sel.value === 'Oui' ? 'block' : 'none';
      if (sel.value !== 'Oui') el.querySelectorAll('input,select').forEach(i => i.value = '');
    });
  });

  // Soins
  document.querySelectorAll('.cf').forEach(f => f.onsubmit = async e => {
    e.preventDefault();
    const o = Object.fromEntries(new FormData(f));
    const a = A.find(x => x.id == f.closest('[data-id]').dataset.id);
    const d = a.data || {};
    d.care = d.care || {};
    (d.care[o.k] = d.care[o.k] || []).push({ n: o.n, d: o.d, rd: o.rd });
    const { error } = await sb.from('animals').update({ data: d }).eq('id', a.id);
    if (error) alert(error.message);
    else { OPEN = a.id; renderAdmin(); }
  });

  // Paiements
  document.querySelectorAll('.pf').forEach(f => f.onsubmit = async e => {
    e.preventDefault();
    const o = Object.fromEntries(new FormData(f));
    o.a = +o.a;
    o.animal_id = f.closest('[data-id]').dataset.id;
    const { error } = await sb.from('payments').insert(o);
    if (error) alert(error.message);
    else { OPEN = +o.animal_id; renderAdmin(); }
  });

  document.querySelectorAll('.pay-save').forEach(b => b.onclick = async () => {
    const row = b.closest('.pay-item');
    const paymentId = row.dataset.payid;
    const amount = Number(row.querySelector('[data-pay="a"]').value);
    const o = {
      l: row.querySelector('[data-pay="l"]').value.trim(),
      a: amount,
      d: row.querySelector('[data-pay="d"]').value
    };
    if (!o.l || !o.d || !Number.isFinite(amount) || amount < 0) return alert('Vérifiez les champs.');
    if (!confirm('Confirmer la modification ?')) return;
    const { error } = await sb.from('payments').update(o).eq('id', paymentId);
    if (error) alert(error.message);
    else { OPEN = Number(row.dataset.animal); renderAdmin(); }
  });

  document.querySelectorAll('.pay-delete').forEach(b => b.onclick = async () => {
    const row = b.closest('.pay-item');
    if (!confirm('Supprimer définitivement ce paiement ?')) return;
    const { error } = await sb.from('payments').delete().eq('id', row.dataset.payid);
    if (error) alert(error.message);
    else { OPEN = Number(row.dataset.animal); renderAdmin(); }
  });

  // Soins : supprimer / modifier
  document.querySelectorAll('.c-del').forEach(b => b.onclick = async () => {
    if (!confirm('Supprimer ce soin ?')) return;
    const el = b.closest('.care-item');
    const a = A.find(x => x.id == el.dataset.animal);
    const d = a.data || {};
    if (d.care && d.care[el.dataset.k]) {
      d.care[el.dataset.k].splice(el.dataset.i, 1);
      const { error } = await sb.from('animals').update({ data: d }).eq('id', a.id);
      if (error) alert(error.message);
      else { OPEN = a.id; renderAdmin(); }
    }
  });
  document.querySelectorAll('.c-edit').forEach(b => b.onclick = async () => {
    const el = b.closest('.care-item');
    const a = A.find(x => x.id == el.dataset.animal);
    const d = a.data || {};
    const k = el.dataset.k, i = el.dataset.i;
    const old = d.care[k][i];
    const n = prompt('Nom du soin :', old.n); if (n === null) return;
    const date = prompt('Date (AAAA-MM-JJ) :', old.d); if (date === null) return;
    const rd = prompt('Rappel (AAAA-MM-JJ, vide si aucun) :', old.rd || ''); if (rd === null) return;
    d.care[k][i] = { n, d: date, rd: rd || null };
    const { error } = await sb.from('animals').update({ data: d }).eq('id', a.id);
    if (error) alert(error.message);
    else { OPEN = a.id; renderAdmin(); }
  });

  // Upload photo
  document.querySelectorAll('.uf').forEach(f => f.onsubmit = async e => {
    e.preventDefault();
    const fileInput = f.querySelector('input[type="file"]');
    const comment = f.querySelector('input[name="comment"]').value;
    const file = fileInput.files[0];
    if (!file) return;
    const btn = f.querySelector('button');
    btn.textContent = 'Envoi...';
    const animalId = +f.dataset.id;
    const animal = A.find(x => x.id == animalId);
    const fileName = `${animalId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error: uploadError } = await sb.storage.from('photos').upload(fileName, file);
    if (uploadError) { alert(uploadError.message); btn.textContent = 'Mettre en ligne'; return; }
    const { data: { publicUrl } } = sb.storage.from('photos').getPublicUrl(fileName);
    const newPhoto = { url: publicUrl, comment, date: new Date().toISOString() };
    const newPhotos = animal.photos ? [...animal.photos, newPhoto] : [newPhoto];
    const { error: updateError } = await sb.from('animals').update({ photos: newPhotos }).eq('id', animalId);
    if (updateError) alert(updateError.message);
    else { OPEN = animalId; renderAdmin(); }
  });

  document.querySelectorAll('.del-photo').forEach(b => b.onclick = async () => {
    if (!confirm('Supprimer cette photo ?')) return;
    const animal = A.find(x => x.id == b.dataset.animal);
    const newPhotos = [...animal.photos];
    newPhotos.splice(+b.dataset.i, 1);
    const { error } = await sb.from('animals').update({ photos: newPhotos }).eq('id', animal.id);
    if (error) alert(error.message);
    else { OPEN = animal.id; renderAdmin(); }
  });
}