/* ============================================================
   NAVIGATION
   ============================================================ */

function renderNav() {
  let links = '<a href="#/">Accueil</a><a href="#/faq">FAQ</a><a href="#/contact">Contact</a>';
  links += secs('page').map(s => `<a href="#/p-${esc(s.id)}">${esc(s.title)}</a>`).join('');

  if (me) {
    const role = prof?.role || 'client';
    const label = role === 'dev' ? 'Admin' :
                  role === 'admin' ? 'Espace éleveur' :
                  role === 'seller' ? 'Espace vendeur' : 'Mon espace';
    links += `<a href="#/compte">${label}</a><a href="#/messages">Messagerie</a>`;
    if (role === 'dev') links += '<a href="#/dev">Admin site</a><a href="#/admin-textes">Documents</a>';
    links += '<a href="#" id="out">Déconnexion</a>';
  } else {
    links += '<a href="#/compte">Connexion / Inscription</a>';
  }

  const navEl = $('#nav');
  if (navEl) navEl.innerHTML = links;

  const o = $('#out');
  if (o) o.onclick = async e => {
    e.preventDefault();
    try { if (closRealtime) { sb.removeChannel(closRealtime); closRealtime = null; } } catch {}
    await sb.auth.signOut();
  };
}