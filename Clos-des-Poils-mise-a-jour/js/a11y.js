/* ============================================================
   ACCESSIBILITÉ
   - annonces pour lecteurs d'écran
   - lien d'évitement, focus après changement de page
   - page courante dans le menu (aria-current)
   - réglages : taille du texte et contraste renforcé
   ============================================================ */

const A11Y = {
  announce(msg) {
    const l = document.getElementById('sr-live');
    if (!l) return;
    l.textContent = '';
    setTimeout(() => { l.textContent = msg; }, 60);
  },
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  apply() {
    const pct = Math.min(150, Math.max(90, +this.get('a11y-size', 100)));
    document.documentElement.style.fontSize = pct + '%';
    document.documentElement.classList.toggle('hc', this.get('a11y-contrast', '0') === '1');
    const c = document.getElementById('a11y-contrast');
    if (c) c.setAttribute('aria-pressed', String(this.get('a11y-contrast', '0') === '1'));
  }
};

function markCurrentNav() {
  const cur = location.hash || '#/';
  document.querySelectorAll('#nav a').forEach(a => {
    const h = a.getAttribute('href');
    const home = h === '#/' && (cur === '#' || cur === '#/' || cur === '');
    if (h === cur || home) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  A11Y.apply();

  const skip = document.getElementById('skip');
  if (skip) skip.onclick = e => { e.preventDefault(); document.getElementById('app').focus(); };

  const bind = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = fn; };
  bind('a11y-minus', () => {
    A11Y.set('a11y-size', Math.max(90, +A11Y.get('a11y-size', 100) - 10)); A11Y.apply();
  });
  bind('a11y-plus', () => {
    A11Y.set('a11y-size', Math.min(150, +A11Y.get('a11y-size', 100) + 10)); A11Y.apply();
  });
  bind('a11y-contrast', () => {
    A11Y.set('a11y-contrast', A11Y.get('a11y-contrast', '0') === '1' ? '0' : '1'); A11Y.apply();
  });
});

/* Après chaque changement de page : titre annoncé, focus sur le contenu */
addEventListener('hashchange', () => {
  markCurrentNav();
  setTimeout(() => {
    const m = document.getElementById('app');
    if (m) { m.focus({ preventScroll: true }); scrollTo(0, 0); }
    A11Y.announce(document.title);
  }, 400);
});
