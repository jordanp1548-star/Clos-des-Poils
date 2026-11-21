async function renderClient() {
  document.title = 'Mon espace — ' + (CFG.name || DEF.name);
  try {
    const { data: A } = await sb.from('animals').select('*').eq('buyer', me.id);
    const ids = (A || []).map(a => a.id);
    let P = [], S = [];
    if (ids.length) {
      const [pRes, sRes] = await Promise.all([
        sb.from('payments').select('*').in('animal_id', ids).order('d'),
        sb.from('signatures').select('*').in('animal_id', ids)
      ]);
      P = pRes.data || [];
      S = sRes.data || [];
    }

    app.innerHTML = `<h1>Bonjour ${esc(prof?.prenom || '')}</h1>`
      + (A?.length
          ? A.map(a => clientAnimalCard(a, P, S)).join('')
          : '<p class="mut">Aucun animal n’est encore rattaché à votre compte. L’éleveur le fera après votre réservation.</p>')
      + secs('client').map(secHtml).join('')
      + '<div id="my-resa"></div>'
      + `<div class="card"><h3>Messagerie avec l’éleveur</h3>
          <p>Posez vos questions, transmettez un document ou demandez des nouvelles de votre réservation.</p>
          <a href="#/messages"><button type="button">Accéder à mes discussions</button></a></div>`
      + `<div class="card"><h3>Mes données</h3>
          <button class="s" id="ex" type="button">Télécharger mes données</button>
          <button class="d" id="del" type="button">Supprimer mon compte</button></div>`;

    loadMyReservations();

    document.querySelectorAll('[data-print-animal]').forEach(b => b.onclick = () => {
      const animal = A.find(x => x.id == b.dataset.printAnimal);
      if (animal) printAnimalSheet(animal, P, S);
    });

    document.querySelectorAll('.sf').forEach(f => f.onsubmit = async e => {
      e.preventDefault();
      const { error } = await sb.from('signatures').insert({
        animal_id: +f.dataset.a,
        user_id: me.id,
        contract_key: f.dataset.k,
        name: f.querySelector('input:not([type=checkbox])').value
      });
      if (error) alert(error.message);
      else { alert('Contrat signé ✔'); renderClient(); }
    });

    const exBtn = $('#ex');
    if (exBtn) exBtn.onclick = () => {
      const blob = new Blob(
        [JSON.stringify({ profil: prof, animaux: A, paiements: P, signatures: S }, null, 1)],
        { type: 'application/json' }
      );
      const u = document.createElement('a');
      u.href = URL.createObjectURL(blob);
      u.download = 'mes-donnees.json';
      u.click();
    };

    const delBtn = $('#del');
    if (delBtn) delBtn.onclick = async () => {
      if (!confirm('Supprimer définitivement votre compte ? Les contrats signés peuvent être conservés selon nos obligations légales.')) return;
      const { error } = await sb.rpc('delete_my_account');
      if (error) { alert(error.message); return; }
      await sb.auth.signOut();
      location.hash = '#/';
    };
  } catch (e) {
    app.innerHTML = '<div class="card err">Erreur : ' + esc(e.message) + '</div>';
  }
}

/* Fiche complète d'un animal pour l'acquéreur */
function clientAnimalCard(a, P, S) {
  const p = P.filter(x => x.animal_id == a.id);
  const paid = p.reduce((s, x) => s + (Number(x.a) || 0), 0);
  const sg = S.filter(x => x.animal_id == a.id);
  const photos = a.photos || [];
  const lastPhoto = photos.length ? photos[photos.length - 1] : null;

  const galerie = photos.length
    ? photos.map((ph, i) => `
        <div style="margin-bottom:15px;border:1px solid var(--line);padding:10px;border-radius:8px">
          <img src="${esc(ph.url)}" style="max-width:100%;border-radius:8px;max-height:300px;object-fit:cover" alt="Photo de ${esc(a.name)}">
          <p style="margin:8px 0 0 0"><b>${dt(ph.date)}</b> — ${esc(ph.comment)}</p>
          ${i === photos.length - 1 ? '<span class="tag" style="margin-left:10px">Photo de profil actuelle</span>' : ''}
        </div>`).join('')
    : '<p class="mut">Aucune photo pour le moment.</p>';

  const r = a.data?.profile || {};

  return `<div class="card">
    <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px;flex-wrap:wrap">
      ${lastPhoto
        ? `<img src="${esc(lastPhoto.url)}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--g)" alt="${esc(a.name)}">`
        : '<div style="width:100px;height:100px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;font-size:2rem">—</div>'}
      <div>
        <h2 style="margin:0">${esc(a.name)} <span class="tag">${esc(a.status)}</span></h2>
        <p style="margin:4px 0 0 0">${esc(a.sp)} · né(e) le ${dt(a.born)}</p>
      </div>
      <button type="button" class="s no-print" data-print-animal="${a.id}" style="margin-left:auto">Télécharger / imprimer la fiche</button>
    </div>

    <h3>Informations complémentaires</h3>
    <div class="row">
      <span><b>Race :</b> ${esc(r.race || 'Non renseignée')}</span>
      <span><b>Sexe :</b> ${esc(a.sex || 'Non renseigné')}</span>
      <span><b>Couleur :</b> ${esc(r.couleur || 'Non renseignée')}</span>
      <span><b>Poids :</b> ${esc(r.poids || 'Non renseigné')}</span>
    </div>
    <p><b>Identification :</b> ${r.identifie === 'Oui'
      ? 'Identifié — ' + esc(r.identification_type || 'Type non précisé') + ' n° ' + esc(r.identification_numero || 'Non renseigné')
      : 'Non identifié'}</p>
    ${r.disponibilite_prevue ? `<p><b>Date de disponibilité estimée :</b> ${dt(r.disponibilite_prevue)}</p>` : ''}
    ${r.disponibilite_reelle ? `<p><b>Date de disponibilité confirmée :</b> ${dt(r.disponibilite_reelle)}</p>` : ''}
    ${r.depart_prevu ? `<p><b>Date de départ prévue :</b> ${dt(r.depart_prevu)}</p>` : ''}
    ${r.caractere ? `<p><b>Caractère :</b> ${esc(r.caractere)}</p>` : ''}
    ${r.habitudes ? `<p><b>Habitudes :</b> ${esc(r.habitudes)}</p>` : ''}
    ${r.alimentation ? `<p><b>Alimentation :</b> ${esc(r.alimentation)}</p>` : ''}
    ${r.notes_sante ? `<p><b>Observations santé :</b> ${esc(r.notes_sante)}</p>` : ''}

    <h3>Actualités en photos</h3>
    ${galerie}

    <hr style="margin:20px 0">
    <h3>Paiements</h3>
    ${p.map(x => `<div>${dt(x.d)} — ${esc(x.l)} : ${eur(x.a)}</div>`).join('') || '<div class="mut">Aucun paiement enregistré</div>'}
    <p><b>Prix ${eur(a.price)} · versé ${eur(paid)} · reste ${eur((Number(a.price) || 0) - paid)}</b></p>
    <p class="mut">Acompte : ${eur(ACOMPTE)} sous 7 jours. ${esc(PAYINFO)}</p>

    <h3>Suivi santé</h3>
    ${careHtml(a)}

    <h3>Contrats</h3>
    ${CT.map(([k, t, x]) => {
      const s = sg.find(y => y.contract_key == k);
      return `<details>
        <summary>${t} ${s ? '✔ signé le ' + dt(s.at) : ''}</summary>
        <p>${esc(fillContract(x, a)).replace(/\n/g, '<br>')}</p>
        ${s ? '' : `<form class="sf" data-a="${a.id}" data-k="${k}">
          <label><input type="checkbox" required style="width:auto;margin-right:6px"> Lu et approuvé</label>
          <label>Nom complet<input required></label>
          <button type="submit">Signer</button></form>`}
      </details>`;
    }).join('')}
  </div>`;
}