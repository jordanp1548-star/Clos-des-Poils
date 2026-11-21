/* ============================================================
   NOYAU : état global, utilitaires, client Supabase, loadCfg
   ============================================================ */

/* Client Supabase */
const sb = supabase.createClient(SB_URL, SB_KEY);

/* État global */
let me = null;
let prof = null;
let CFG = { ...DEF };
let OPEN = null;
let closRealtime = null;

/* Helpers courts */
const $ = s => document.querySelector(s);
const app = $('#app');

/* Échappement HTML */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

/* Formatage */
const eur = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n||0);
const dt = d => d ? new Date(d).toLocaleDateString('fr-FR') : '';
const dtFull = d => d ? new Date(d).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}) : '';
const dd = d => d ? dt(d) : '[à définir]';

/* Substitution des {{variables}} dans les documents légaux */
const L = x => x.replace(/\{\{(\w+)\}\}/g, (m,k) => {
  return CFG.legal?.[k] || LEGAL_DEFAULTS[k] || `[${LKM[k]||k} à compléter]`;
});

/* Formatage des documents (paragraphes / titres) */
const fmt = x => x.split('\n\n').map(p => {
  if (p.startsWith('# ')) {
    const lines = p.slice(2).split('\n');
    return `<h3>${esc(lines[0])}</h3>${esc(lines.slice(1).join('\n')).replace(/\n/g,'<br>')}`;
  }
  return `<p>${esc(p).replace(/\n/g,'<br>')}</p>`;
}).join('');

/* Appel d'une edge function Supabase */
async function fn(name, body) {
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) {
    let m = error.message;
    try { m = (await error.context.json()).error || m; } catch {}
    throw new Error(m);
  }
  return data;
}

/* Vérifications de rôle */
const isA = () => prof?.role === 'admin' || prof?.role === 'dev';
const isD = () => prof?.role === 'dev';
const isStaff = () => ['admin','dev'].includes(prof?.role);

/* Sections dynamiques (home/client/page) */
const secs = w => (CFG.sections || []).filter(s => s.where === w);
const secHtml = s => `<div class="card"><h2>${esc(s.title)}</h2>${s.html}</div>`;

/* Chargement de la configuration du site depuis Supabase */
async function loadCfg() {
  try {
    const { data } = await sb.from('settings').select('value').eq('key','site_config').maybeSingle();
    try {
      CFG = { ...DEF, ...JSON.parse(data?.value || '{}') };
    } catch {
      CFG = { ...DEF };
    }
  } catch {
    CFG = { ...DEF };
  }

  if (CFG.elev) ELEV = CFG.elev;
  if (CFG.acompte != null) ACOMPTE = +CFG.acompte;
  if (CFG.payinfo) PAYINFO = CFG.payinfo;
  if (CFG.contracts) CT = CFG.contracts;
  if (CFG.careCats) CC = CFG.careCats;
  if (CFG.statuses) ST = CFG.statuses;

  // Couleurs personnalisées
  const r = document.documentElement.style;
  ['g','a','bg'].forEach(k => r.removeProperty('--'+k));
  for (const [k,v] of Object.entries(CFG.colors || {})) if (v) r.setProperty('--'+k, v);

  // CSS personnalisé
  let st = $('#cs');
  if (!st) { st = document.createElement('style'); st.id = 'cs'; document.head.append(st); }
  st.textContent = CFG.css || '';

  // Titre & marque
  const brand = $('#brand');
  if (brand) brand.textContent = CFG.name || DEF.name;
  document.title = CFG.name || DEF.name;
}

/* Remplacement des libellés personnalisés (uiLabels) */
function applyDeveloperLabels(root = document) {
  const labels = CFG.uiLabels || {};
  if (!Object.keys(labels).length) return;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  nodes.forEach(node => {
    const original = node.nodeValue.trim();
    if (Object.prototype.hasOwnProperty.call(labels, original)) {
      const leading = node.nodeValue.match(/^\s*/)?.[0] || '';
      const trailing = node.nodeValue.match(/\s*$/)?.[0] || '';
      node.nodeValue = leading + labels[original] + trailing;
    }
  });
}