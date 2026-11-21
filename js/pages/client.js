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
      + '<div id="my-resa"></div>'
      + (A?.length
          ? A.map(a => clientAnimalCard(a, P, S)).join('')
          : '<p class="mut">Aucun animal n’est rattaché à votre compte pour le moment. Il le sera dès que l’éleveur aura accepté une réservation.</p>')
      + secs('client').map(secHtml).join('')
      + `<div class="card"><h2>Messagerie avec l’éleveur</h2>
          <p>Posez vos questions, transmettez un document ou demandez des nouvelles de votre réservation.</p>
          <a href="#/messages"><button type="button">Accéder à mes discussions</button></a></div>`
      + `<div class="card"><h2>Mes données</h2>
          <button class="s" id="ex" type="button">Télécharger mes données</button>
          <button class="d" id="del" type="button">Supprimer mon compte</button></div>`;

    loadMyReservations(!A?.length);

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

/* Fiche d'un animal pour l'acquéreur, du plus important au moins important :
   1 en-tête, 2 ma réservation (dates, montants, à faire), 3 contrats,
   4 paiements, 5 fiche de l'animal (identité, caractère, origines, santé, photos) */
function clientAnimalCard(a, P, S) {
  const p = P.filter(x => x.animal_id == a.id);
  const paid = p.reduce((s, x) => s + (Number(x.a) || 0), 0);
  const left = (Number(a.price) || 0) - paid;
  const sg = S.filter(x => x.animal_id == a.id);
  const photos = a.photos || [];
  const lastPhoto = photos.length ? photos[photos.length - 1] : null;
  const r = a.data?.profile || {};
  const todo = CT.filter(([k]) => !sg.find(y => y.contract_key == k)).length;

  const fact = (label, v) => v ? `<div><dt>${esc(label)}</dt><dd>${v}</dd></div>` : '';
  const dispo = r.disponibilite_reelle || r.disponibilite_prevue || a.remise || '';
  const dispoLabel = r.disponibilite_reelle ? 'Disponible dès le' : 'Disponibilité estimée';

  return `<div class="card">
    <div style="display:flex;align-items:center;gap:15px;margin-bottom:16px;flex-wrap:wrap">
      ${lastPhoto
        ? `<img src="${esc(lastPhoto.url)}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--g)" alt="Photo de ${esc(a.name)}">`
        : '<div aria-hidden="true" style="width:100px;height:100px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;font-size:2rem">—</div>'}
      <div>
        <h2 style="margin:0">${esc(a.name)} <span class="tag">${esc(a.status)}</span></h2>
        <p style="margin:4px 0 0 0">${esc(a.sp)}${a.born ? ' · né(e) le ' + dt(a.born) : ''}</p>
      </div>
      <button type="button" class="s no-print" data-print-animal="${a.id}" style="margin-left:auto">Télécharger / imprimer la fiche</button>
    </div>

    <h3>Ma réservation</h3>
    ${todo ? `<p class="clos-todo"><b>À faire :</b> signer ${todo} contrat(s) (voir « Contrats » ci-dessous).</p>` : ''}
    <dl class="clos-facts">
      ${fact('Prix', eur(a.price))}
      ${fact('Déjà versé', eur(paid))}
      ${fact('Reste à payer', eur(left))}
      ${fact(dispoLabel, dispo ? dt(dispo) : '')}
      ${fact('Départ prévu', r.depart_prevu ? dt(r.depart_prevu) : '')}
      ${fact('Date de remise', a.remise ? dt(a.remise) : '')}
    </dl>

    <h3>Contrats</h3>
    ${CT.map(([k, t, x]) => {
      const s = sg.find(y => y.contract_key == k);
      return `<details>
        <summary>${esc(t)} ${s ? '✔ signé le ' + dt(s.at) : '— à signer'}</summary>
        <p>${esc(fillContract(x, a)).replace(/\n/g, '<br>')}</p>
        ${s ? '' : `<form class="sf" data-a="${a.id}" data-k="${esc(k)}">
          <label><input type="checkbox" required style="width:auto;margin-right:6px"> Lu et approuvé</label>
          <label>Nom complet<input required></label>
          <button type="submit">Signer</button></form>`}
      </details>`;
    }).join('')}

    <h3>Paiements</h3>
    ${p.map(x => `<div>${dt(x.d)} — ${esc(x.l)} : ${eur(x.a)}</div>`).join('') || '<div class="mut">Aucun paiement enregistré</div>'}
    <p class="mut">Acompte : ${eur(ACOMPTE)} sous 7 jours. ${esc(PAYINFO)}</p>

    <hr style="margin:20px 0">
    ${animalSheetHtml(a, { dates: false })}
  </div>`;
}
