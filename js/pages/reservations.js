/* ============================================================
   RÉSERVATIONS
   - openReserveDialog : le client envoie une demande
   - loadMyReservations : le client suit ses demandes
   - renderReservations : l'éleveur accepte ou refuse
   - updateResaBadge : nombre de demandes en attente (menu)
   ============================================================ */

const RESA_LABEL = { en_attente: 'En attente', acceptee: 'Acceptée', refusee: 'Refusée' };
const RESA_ICON = { en_attente: '⏳', acceptee: '✔', refusee: '✖' };
const resaTag = s => `<span class="tag resa-${esc(s)}">${RESA_ICON[s] || ''} ${esc(RESA_LABEL[s] || s)}</span>`;

/* ---------- CLIENT : formulaire de demande ---------- */
function openReserveDialog(a) {
  if (!a) return;
  if (!me) { location.hash = '#/compte'; return; }
  if (prof?.role !== 'client') {
    alert('Seuls les comptes clients peuvent demander une réservation.');
    return;
  }
  const old = $('#resa-dialog');
  if (old) old.remove();

  const d = document.createElement('dialog');
  d.id = 'resa-dialog';
  d.setAttribute('aria-labelledby', 'resa-title');
  d.innerHTML = `
    <form id="resa-form">
      <h2 id="resa-title">Demander la réservation de ${esc(a.name)}</h2>
      <p>Prix : <b>${eur(a.price)}</b>. Un acompte de ${eur(ACOMPTE)} est demandé si l’éleveur accepte.
         Aucun paiement n’est demandé maintenant.</p>
      <label>Message pour l’éleveur (facultatif)
        <textarea name="message" rows="4" maxlength="1000"
          placeholder="Présentez-vous, indiquez vos questions ou la date souhaitée…"></textarea>
      </label>
      <p id="resa-err" class="err" role="alert"></p>
      <div class="row">
        <button type="submit">Envoyer ma demande</button>
        <button type="button" class="s" id="resa-cancel">Annuler</button>
      </div>
    </form>`;
  document.body.append(d);
  d.addEventListener('close', () => d.remove());
  d.querySelector('#resa-cancel').onclick = () => d.close();

  d.querySelector('#resa-form').onsubmit = async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    const err = d.querySelector('#resa-err');
    err.textContent = '';
    btn.disabled = true;
    const { error } = await sb.from('reservations').insert({
      animal_id: a.id,
      message: e.target.message.value.trim() || null
    });
    if (error) {
      btn.disabled = false;
      err.textContent = error.code === '23505'
        ? 'Vous avez déjà une demande en attente pour cet animal.'
        : error.message;
      return;
    }
    d.innerHTML = `
      <h2 id="resa-title">Demande envoyée ✔</h2>
      <p>L’éleveur va l’étudier. Vous verrez sa réponse dans <a href="#/compte" id="resa-go">Mon espace</a>.</p>
      <button type="button" id="resa-ok">Fermer</button>`;
    d.querySelector('#resa-ok').onclick = () => d.close();
    d.querySelector('#resa-go').onclick = () => d.close();
    d.querySelector('#resa-ok').focus();
    if (window.A11Y) A11Y.announce('Demande de réservation envoyée.');
  };

  d.showModal();
  d.querySelector('textarea').focus();
}

/* ---------- CLIENT : suivi de ses demandes (dans Mon espace) ---------- */
async function loadMyReservations(showEmpty = true) {
  const host = $('#my-resa');
  if (!host || !me) return;
  const { data: R, error } = await sb.from('reservations')
    .select('*').eq('user_id', me.id).order('created_at', { ascending: false });
  if (error) {
    host.innerHTML = '<div class="card err">Demandes indisponibles : ' + esc(error.message) + '</div>';
    return;
  }
  if (!(R || []).length && !showEmpty) { host.innerHTML = ''; return; }
  host.innerHTML = `<div class="card">
    <h2>Mes demandes de réservation</h2>
    ${(R || []).length
      ? R.map(r => `<div class="resa-item">
          <p><b>${esc(r.animal_name || 'Animal')}</b> ${resaTag(r.status)}
             <span class="mut">— demandée le ${dt(r.created_at)}</span></p>
          ${r.message ? `<p class="mut">Votre message : ${esc(r.message)}</p>` : ''}
          ${r.status !== 'en_attente'
            ? `<p><b>Réponse de l’éleveur (${dt(r.decided_at)}) :</b> ${esc(r.response || (r.status === 'acceptee' ? 'Réservation acceptée. Contactez l’éleveur pour l’acompte.' : 'Demande refusée.'))}</p>`
            : '<p class="mut">L’éleveur n’a pas encore répondu.</p>'}
        </div>`).join('')
      : '<p class="mut">Aucune demande pour le moment. Depuis l’accueil, choisissez un animal puis « Demander une réservation ».</p>'}
  </div>`;
}

/* ---------- ÉLEVEUR : liste et décision ---------- */
async function renderReservations() {
  document.title = 'Réservations — ' + (CFG.name || DEF.name);
  app.innerHTML = '<h1>Réservations</h1><p class="mut" role="status">Chargement…</p>';
  try {
    const { data: R, error } = await sb.from('reservations')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const wait = (R || []).filter(r => r.status === 'en_attente');
    const done = (R || []).filter(r => r.status !== 'en_attente');

    app.innerHTML = `${backLink()}<h1>Réservations</h1>
      <p class="clos-page-intro">Acceptez ou refusez chaque demande. Une acceptation passe l’animal en « Réservée » et le rattache au client.</p>
      <h2>En attente (${wait.length})</h2>
      ${wait.map(r => `<form class="card resa-decide" data-id="${r.id}">
          <h3>${esc(r.animal_name || 'Animal')} ${resaTag(r.status)}</h3>
          <p><b>Client :</b> ${esc(r.client_name || 'Inconnu')} — demande du ${dtFull(r.created_at)}</p>
          <p><b>Message :</b> ${r.message ? esc(r.message) : '<span class="mut">Aucun message</span>'}</p>
          <label>Réponse au client (facultatif)
            <textarea name="response" rows="2" maxlength="1000"></textarea></label>
          <div class="row">
            <button type="button" data-accept="1">Accepter la réservation de ${esc(r.animal_name || 'cet animal')}</button>
            <button type="button" class="d" data-accept="0">Refuser la demande</button>
          </div>
        </form>`).join('') || '<p class="mut">Aucune demande en attente.</p>'}
      <h2>Déjà traitées (${done.length})</h2>
      ${done.map(r => `<div class="card">
          <p><b>${esc(r.animal_name || 'Animal')}</b> ${resaTag(r.status)} — ${esc(r.client_name || '')}</p>
          <p class="mut">Demande du ${dt(r.created_at)}, traitée le ${dt(r.decided_at)}.${r.response ? ' Réponse : ' + esc(r.response) : ''}</p>
        </div>`).join('') || '<p class="mut">Aucune demande traitée.</p>'}`;

    document.querySelectorAll('.resa-decide [data-accept]').forEach(b => b.onclick = async () => {
      const f = b.closest('form');
      const accept = b.dataset.accept === '1';
      const msg = accept
        ? 'Accepter cette réservation ? L’animal passera en « Réservée ».'
        : 'Refuser cette demande ?';
      if (!confirm(msg)) return;
      f.querySelectorAll('button').forEach(x => x.disabled = true);
      const { error } = await sb.rpc('decide_reservation', {
        p_id: +f.dataset.id,
        p_accept: accept,
        p_response: f.response.value
      });
      if (error) { alert(error.message); }
      else if (window.A11Y) A11Y.announce(accept ? 'Réservation acceptée.' : 'Demande refusée.');
      renderReservations();
      updateResaBadge();
    });
  } catch (e) {
    app.innerHTML = '<h1>Réservations</h1><div class="card err" role="alert">'
      + esc(e.message) + '<br>Avez-vous exécuté le fichier reservations.sql dans Supabase ?</div>';
  }
}

/* ---------- Pastille dans le menu (éleveur) ---------- */
async function updateResaBadge() {
  const a = $('#nav-gestion');
  if (!a || !isA()) return;
  try {
    const { count, error } = await sb.from('reservations')
      .select('id', { count: 'exact', head: true }).eq('status', 'en_attente');
    if (error || !count) { a.textContent = 'Gestion'; a.removeAttribute('aria-label'); return; }
    a.textContent = 'Gestion (' + count + ')';
    a.setAttribute('aria-label', 'Gestion, ' + count + ' demande(s) de réservation en attente');
  } catch {}
}
