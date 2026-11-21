/* ============================================================
   ROUTEUR + INITIALISATION
   ============================================================ */

function routeInner() {
  const h = location.hash.slice(2) || '';

  // Documents légaux
  if (DOCS[h]) return renderLegalDoc(h);

  // Pages publiques
  if (h === 'faq') return renderFaq();
  if (h === 'contact') return renderContact();

  // Messagerie
  if (h === 'messages') {
    if (!me) { location.hash = '#/compte'; return; }
    if (!['client','seller','admin','dev'].includes(prof?.role)) {
      app.innerHTML = '<h1>Messagerie</h1><div class="card err">Votre compte n’a pas accès à la messagerie.</div>';
      return;
    }
    return renderMessages();
  }

  // Espaces par rôle
  if (h === 'compte') {
    if (!me) return renderLogin();
    if (prof?.role === 'dev' || prof?.role === 'admin') return renderGestion();
    if (prof?.role === 'seller') return renderSeller();
    return renderClient();
  }

  if (h === 'vendeur') {
    if (me && prof?.role === 'seller') return renderSeller();
    location.hash = '#/compte';
    return;
  }

  if (h === 'gestion') {
    if (me && isA()) return renderGestion();
    location.hash = '#/compte';
    return;
  }

  if (h === 'eleveur') {
    if (me && isA() && typeof renderAdmin === 'function') return renderAdmin();
    location.hash = '#/gestion';
    return;
  }

  if (h === 'reservations') {
    if (me && isA()) return renderReservations();
    location.hash = '#/compte';
    return;
  }

  if (h === 'admin-textes' && isA()) return renderTextes();
  if (h === 'dev' && isD()) return renderDev();

  // Pages dynamiques (sections personnalisées)
  if (h.startsWith('p-')) {
    const x = secs('page').find(y => 'p-' + y.id === h);
    if (x) { document.title = x.title + ' — ' + (CFG.name || DEF.name); app.innerHTML = `<h1>${esc(x.title)}</h1>${x.html}`; return; }
  }

  // Par défaut : accueil
  renderHome();
}

/* Affichage de secours si une page plante (au lieu d'une page vide) */
function showRouteError(e) {
  console.error(e);
  app.innerHTML = '<h1>Page indisponible</h1><div class="card err" role="alert">Cette page n’a pas pu s’afficher : '
    + esc(e?.message || e) + '<br><br><a href="#/">Retour à l’accueil</a></div>';
}

function route() {
  try {
    const r = routeInner();
    if (r && typeof r.catch === 'function') r.catch(showRouteError);
  } catch (e) { showRouteError(e); }
}

/* Initialisation complète */
async function init() {
  try {
    await loadCfg();
    const { data: { session } } = await sb.auth.getSession();
    me = session?.user || null;
    prof = null;
    if (me) {
      const { data } = await sb.from('profiles').select('*').eq('id', me.id).single();
      prof = data;
    }
  } catch (e) {
    if (!CFG.name) CFG = { ...DEF };
    app.innerHTML = '<div class="card err"><b>Erreur de chargement.</b><br>' +
      esc(e.message || e) +
      '<br><br>Vérifiez votre connexion internet puis rechargez la page.</div>';
    return;
  }
  renderNav();
  route();
  applyDeveloperLabels();
}

/* Écoute des changements d'état (connexion/déconnexion) */
sb.auth.onAuthStateChange((ev, sess) => {
  const id = sess?.user?.id || null;
  if (id !== (me?.id || null)) setTimeout(init, 0);
});

/* Écoute des changements de route */
addEventListener('hashchange', route);

/* Démarrage */
init();