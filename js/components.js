/* ============================================================
   COMPOSANTS RÉUTILISABLES
   - catOf : catégorie d'un animal
   - pageHero : bandeau de page
   - careHtml : liste des soins
   - printAnimalSheet : génération PDF
   ============================================================ */

/* Catégorie d'un animal à partir de son espèce */
function catOf(v) {
  const x = String(v || '').toLowerCase();
  if (/bovin|vache|taureau|veau/.test(x)) return ['Bovins','🐄'];
  if (/caprin|chèvre|chevre|bouc|chevreau/.test(x)) return ['Caprins','🐐'];
  if (/ovin|mouton|brebis|agneau/.test(x)) return ['Ovins','🐑'];
  if (/équin|equin|cheval|poney|âne|ane/.test(x)) return ['Équins','🐴'];
  if (/porcin|cochon|porc|truie/.test(x)) return ['Porcins','🐖'];
  if (/volaille|poule|coq|canard|oie|dinde|pintade/.test(x)) return ['Volailles','🐓'];
  if (/chien|chiot|canin/.test(x)) return ['Chiens','🐕'];
  if (/chat|chaton|félin|felin/.test(x)) return ['Chats','🐈'];
  if (/lapin|lapereau|cunicul/.test(x)) return ['Lapins','🐇'];
  return ['Autres animaux','🐾'];
}

/* Bandeau de page (Hero) */
function pageHero(title, kicker, desc) {
  return `<section class="clos-hero" style="margin:0 0 24px">
    <div class="clos-kicker">${esc(kicker)}</div>
    <h1>${esc(title)}</h1>
    <p>${esc(desc)}</p>
  </section>`;
}

/* Liste des soins pour un animal */
function careHtml(a, editable = false) {
  return Object.entries(CC).map(([k, l]) => {
    const c = a.data?.care?.[k] || [];
    return c.length
      ? `<h4>${esc(l)}</h4>` + c.map((x, i) => `
          <div class="care-item no-print"
               data-animal="${a.id}" data-k="${k}" data-i="${i}"
               style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;border-bottom:1px dotted var(--line);padding-bottom:4px">
            <span>${esc(x.n)} — ${dt(x.d)}${x.rd ? ' · rappel le ' + dt(x.rd) : ''}</span>
            ${editable ? `<span>
              <button type="button" class="s c-edit" style="padding:2px 8px;font-size:0.8rem;margin-left:8px">Modifier</button>
              <button type="button" class="d c-del" style="padding:2px 8px;font-size:0.8rem">Supprimer</button>
            </span>` : ''}
          </div>`).join('')
      : '';
  }).join('') || '<div class="mut">Aucun soin enregistré</div>';
}

/* Substitution des variables dans les contrats */
function fillContract(t, a) {
  return t
    .replace(/\{eleveur\}/g, ELEV)
    .replace(/\{acquereur\}/g, (prof?.prenom || '') + ' ' + (prof?.nom || ''))
    .replace(/\{animal\}/g, a.name)
    .replace(/\{desc\}/g, a.descr || '')
    .replace(/\{naissance\}/g, dd(a.born))
    .replace(/\{remise\}/g, dd(a.remise))
    .replace(/\{prix\}/g, eur(a.price))
    .replace(/\{acompte\}/g, eur(ACOMPTE));
}

/* Génération PDF / impression de la fiche animal */
function printAnimalSheet(a, P = [], S = []) {
  const profile = a.data?.profile || {};
  const payments = P.filter(x => x.animal_id == a.id);
  const paid = payments.reduce((s, x) => s + (Number(x.a) || 0), 0);
  const photos = a.photos || [];
  const care = a.data?.care || {};
  const pdfCfg = CFG.pdf || {};
  const val = v => v !== undefined && v !== null && String(v).trim() !== '' ? esc(v) : '';
  const field = (label, v) => val(v) ? `<div class="field"><b>${label}</b><span>${val(v)}</span></div>` : '';
  const block = (title, content) => content ? `<section><h2>${title}</h2>${content}</section>` : '';
  const careHtmlStr = Object.entries(CC).map(([key, label]) => {
    const entries = care[key] || [];
    return entries.length
      ? `<div class="careline"><b>${esc(label)} :</b> ${entries.map(x => `${esc(x.n||'')} (${dt(x.d)}${x.rd ? ' ; rappel '+dt(x.rd) : ''})`).join(' · ')}</div>`
      : '';
  }).join('') || '<p>Aucun soin enregistré.</p>';
  const paymentsHtml = payments.length
    ? payments.map(x => `${dt(x.d)} ${esc(x.l||'Paiement')} : ${eur(x.a)}`).join(' · ')
    : 'Aucun paiement enregistré';
  const photo = photos.length ? `<img class="portrait" src="${esc(photos[photos.length-1].url)}" alt="">` : '';
  const availability = profile.disponibilite_reelle || profile.disponibilite_prevue || '';

  const doc = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fiche ${esc(a.name)}</title>
  <style>
  @page{size:A4 portrait;margin:7mm}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;color:#26332b;font:7.3pt/1.22 Arial,sans-serif;width:100%}
  header{display:flex;justify-content:space-between;align-items:end;border-bottom:2px solid #315b45;padding:0 0 4px;margin-bottom:5px}
  .brand{font-size:12pt;font-weight:bold;color:#315b45}.sub{font-size:7pt;color:#68756c;text-align:right}
  .hero{display:flex;align-items:center;gap:9px;margin:4px 0 6px;min-height:44px}
  .portrait{width:48px;height:48px;object-fit:cover;border-radius:6px}
  h1{font-size:15pt;margin:0 0 2px}
  h2{font-size:8.2pt;color:#315b45;margin:0 0 3px;padding-bottom:2px;border-bottom:1px solid #dfe6df}
  h3{font-size:7.4pt;margin:3px 0 1px}
  .meta{color:#68756c;font-size:6.6pt}
  .layout{display:grid;grid-template-columns:1fr 1fr;gap:5px 9px;align-items:start}
  section{border:1px solid #e1e6df;border-radius:4px;padding:4px;break-inside:avoid;page-break-inside:avoid;min-width:0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 7px}
  .field{min-width:0;padding:1px 0;border-bottom:1px dotted #e1e6df;overflow-wrap:anywhere}
  .field b{color:#68756c;font-size:6.3pt;display:block;font-weight:600}
  .field span{display:block}
  p{margin:2px 0}ul{margin:2px 0;padding-left:12px}
  .careline{margin:2px 0;overflow-wrap:anywhere}
  footer{border-top:1px solid #dfe6df;margin-top:5px;padding-top:3px;font-size:6pt;color:#68756c}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <header><div class="brand">${esc(pdfCfg.title || CFG.name || 'Le Clos des Poils')}</div><div class="sub">${esc(pdfCfg.subtitle || 'Fiche individuelle de présentation et de suivi')}</div></header>
  <div class="hero">${photo}<div><h1>${esc(a.name)}</h1><div>${esc(a.sp||'Espèce non renseignée')} · ${esc(a.sex||'Sexe non renseigné')} · ${esc(a.status||'Statut non renseigné')}</div><div class="meta">Fiche éditée le ${new Date().toLocaleDateString('fr-FR')} · ${photos.length} photo(s)</div></div></div>
  <div class="layout">
  ${block('IDENTITÉ ET DISPONIBILITÉ',`<div class="grid">${field('Espèce',a.sp)}${field('Race',profile.race)}${field('Sexe',a.sex)}${field('Couleur / robe',profile.couleur)}${field('Date de naissance',dt(a.born)||'À confirmer')}${field('Disponible à partir du',dt(availability)||'À confirmer')}${field('Poids actuel',profile.poids)}${field('Statut',a.status)}${field('Identification',profile.identifie==='Oui'?(profile.identification_type||'')+' '+(profile.identification_numero||''):'Non renseignée')}${field('Date d’identification',dt(profile.identification_date))}</div>${field('Description',a.descr)}`)}
  ${block('ORIGINES ET PORTÉE',`<div class="grid">${field('Référence de portée',profile.numero_portee)}${field('Père',profile.pere_portee||profile.pere)}${field('Mère',profile.mere_portee||profile.mere)}${field('Date de saillie',dt(profile.date_saillie))}${field('Date de mise bas',dt(profile.date_mise_bas))}${field('Petits nés / vivants',`${profile.petits_nes??''}${profile.petits_vivants!=null?' / '+profile.petits_vivants:''}`)}${field('Petits sevrés',profile.petits_sevres)}${field('Date de sevrage',dt(profile.date_sevrage))}${field('Variété de la portée',profile.race_portee)}${field('Poids moyen naissance',profile.poids_naissance)}</div>${field('Observations portée',profile.deroulement_portee)}`)}
  ${block('CARACTÈRE ET QUOTIDIEN',`<div class="grid">${field('Caractère',profile.caractere)}${field('Habitudes',profile.habitudes)}${field('Alimentation',profile.alimentation)}${field('Conseils',profile.conseils)}</div>`)}
  ${block('SANTÉ ET SOINS',`<div class="grid">${field('Dernier contrôle vétérinaire',dt(profile.dernier_controle))}${field('Antécédents',profile.antecedents)}${field('Observations santé',profile.notes_sante)}</div>${careHtmlStr}`)}
  ${block('RÉSERVATION ET FINANCES',`<div class="grid">${field('Disponibilité estimée',dt(profile.disponibilite_prevue))}${field('Disponibilité confirmée',dt(profile.disponibilite_reelle))}${field('Date de réservation',dt(profile.date_reservation))}${field('Départ prévu',dt(profile.depart_prevu))}${field('Date de remise',dt(a.remise))}${field('Prix de vente',eur(a.price))}${field('Total versé',eur(paid))}${field('Solde restant',eur((Number(a.price)||0)-paid))}${field('Acompte déclaré',eur(profile.acompte))}</div><h3>Historique des paiements</h3><p>${paymentsHtml}</p>`)}
  </div>
  <footer>${esc(pdfCfg.footer || 'Document de suivi édité par l’éleveur. Ne remplace pas les documents vétérinaires ou officiels.')}</footer>
  <script>window.addEventListener('load',()=>{const imgs=[...document.images];Promise.all(imgs.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r}))).then(()=>setTimeout(()=>window.print(),200));});<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Autorisez les fenêtres contextuelles pour générer le document.'); return; }
  win.document.open();
  win.document.write(doc);
  win.document.close();
}