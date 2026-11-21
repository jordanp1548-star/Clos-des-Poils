/* ============================================================
   GESTION : page unique pour l'éleveur (admin) et le développeur (dev)
   Regroupe réservations, espace éleveur, messagerie, réglages, textes légaux.
   ============================================================ */

const backLink = () => '<p class="no-print"><a href="#/gestion">← Retour à la gestion</a></p>';

async function renderGestion() {
  document.title = 'Gestion — ' + (CFG.name || DEF.name);
  const tiles = [['#/reservations', 'Réservations', 'Accepter ou refuser les demandes des clients.', 'gest-resa']];
  if (typeof renderAdmin === 'function') {
    tiles.push(['#/eleveur', 'Animaux et acheteurs', 'Fiches des animaux, paiements et suivi des acheteurs.']);
  }
  tiles.push(['#/messages', 'Messagerie', 'Répondre aux clients et aux vendeurs.']);
  if (isD()) {
    tiles.push(
      ['#/dev', 'Réglages du site', 'Textes, couleurs, sections, comptes et données.'],
      ['#/admin-textes', 'Textes légaux', 'Mentions légales, règlement, confidentialité, conditions de vente.']
    );
  }
  app.innerHTML = `<h1>Gestion</h1>
    <p class="clos-page-intro">Tout ce qu’il faut pour gérer l’élevage, au même endroit.</p>
    <div class="clos-contact-grid">
      ${tiles.map(([h, t, d, id]) => `<a class="card clos-tile" href="${h}">
        <h2>${esc(t)} ${id ? `<span class="tag" id="${id}" hidden></span>` : ''}</h2>
        <p>${esc(d)}</p></a>`).join('')}
    </div>`;
  try {
    const { count } = await sb.from('reservations')
      .select('id', { count: 'exact', head: true }).eq('status', 'en_attente');
    const t = $('#gest-resa');
    if (t && count) { t.textContent = count + ' en attente'; t.hidden = false; }
  } catch {}
}
