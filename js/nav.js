/* ============================================================
   NAVIGATION
   Visiteur : Accueil · FAQ · Contact · Connexion
   Client   : … · Mon espace · Messagerie · Déconnexion
   Vendeur  : … · Mes annonces · Messagerie · Déconnexion
   Éleveur / dev : … · Gestion (pastille) · Messagerie · Déconnexion
   ============================================================ */

function renderNav() {
  let links = '<a href="#/">Accueil</a><a href="#/faq">FAQ</a><a href="#/contact">Contact</a>';
  links += secs('page').map(s => `<a href="#/p-${esc(s.id)}">${esc(s.title)}</a>`).join('');

  if (me) {
    const role = prof?.role || 'client';
    if (role === 'admin' || role === 'dev') links += '<a href="#/gestion" id="nav-gestion">Gestion</a>';
    else if (role === 'seller') links += '<a href="#/compte">Mes annonces</a>';
    else links += '<a href="#/compte">Mon espace</a>';
    links += '<a href="#/messages">Messagerie</a><a href="#" id="out">Déconnexion</a>';
  } else {
    links += '<a href="#/compte">Connexion</a>';
  }

  const navEl = $('#nav');
  if (navEl) navEl.innerHTML = links;

  if (typeof markCurrentNav === 'function') markCurrentNav();
  if (typeof updateResaBadge === 'function') updateResaBadge();

  const o = $('#out');
  if (o) o.onclick = async e => {
    e.preventDefault();
    try { if (closRealtime) { sb.removeChannel(closRealtime); closRealtime = null; } } catch {}
    await sb.auth.signOut();
  };
}
