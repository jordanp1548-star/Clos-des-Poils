/* ============================================================
   MESSAGERIE
   ============================================================ */

async function closGetConversations() {
  const { data, error } = await sb.from('conversations')
    .select('id,customer_id,assigned_to,subject,status,created_at,updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function closGetMessages(cid) {
  const { data, error } = await sb.from('messages')
    .select('id,conversation_id,sender_id,body,created_at')
    .eq('conversation_id', cid)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

/* Récupération des contacts disponibles */
async function closGetContacts() {
  try {
    const { data, error } = await sb.rpc('clos_contact_directory');
    if (error) throw error;
    return (data || []).filter(p => p.id !== me.id);
  } catch {
    const roles = prof?.role === 'client' ? ['seller'] : ['seller','client','admin'];
    const { data, error } = await sb.from('profiles').select('id,prenom,nom,role').in('role', roles);
    if (error) return [];
    return (data || []).filter(p => p.id !== me.id);
  }
}

/* Formulaire de nouvelle conversation */
async function closStartForm() {
  const people = await closGetContacts();
  return `<section class="card">
    <h2>Nouvelle conversation</h2>
    <form id="clos-new-conversation">
      <label>Personne à contacter
        <select name="recipient_id" required>
          <option value="">Choisir un contact…</option>
          ${people.map(p => `<option value="${p.id}">${esc([p.prenom,p.nom].filter(Boolean).join(' ') || p.id)} — ${esc(p.role)}</option>`).join('')}
        </select>
      </label>
      <label>Objet<input name="subject" required maxlength="140" placeholder="Objet de votre message"></label>
      <label>Message<textarea name="body" required maxlength="5000" placeholder="Écrivez votre message…"></textarea></label>
      <button type="submit">Envoyer</button>
    </form>
    ${!people.length ? '<p class="mut">Aucun contact disponible pour le moment.</p>' : ''}
  </section>`;
}

/* Création d'une conversation avec validation du destinataire */
async function closCreateConversation(subject, body, animalId = null, recipientId = null) {
  const role = prof?.role;
  let target = recipientId;
  if (role === 'client') {
    if (!target) throw new Error('Choisissez un vendeur à contacter.');
    const { data: s } = await sb.from('profiles').select('id,role').eq('id', target).single();
    if (!s || s.role !== 'seller') throw new Error('Un client peut uniquement contacter un vendeur.');
  } else if (!['seller','dev','admin'].includes(role)) {
    throw new Error('Votre compte ne peut pas démarrer une conversation.');
  }
  if (!target) throw new Error('Choisissez une personne à contacter.');

  const row = {
    customer_id: role === 'client' ? me.id : target,
    assigned_to: role === 'client' ? target : (role === 'seller' ? me.id : null),
    subject: subject.trim(),
    status: 'ouverte',
    animal_id: animalId
  };
  const { data, error } = await sb.from('conversations').insert(row).select('id').single();
  if (error) throw error;
  const { error: meErr } = await sb.from('messages').insert({
    conversation_id: data.id,
    sender_id: me.id,
    body: body.trim()
  });
  if (meErr) throw meErr;
  return data.id;
}

/* Coquille de messagerie */
function closMessageShell(title, conversations) {
  return `<h2>${esc(title)}</h2>
    <div class="card">
      <div class="row" style="align-items:center">
        <div style="flex:1">
          <b>${conversations.length} conversation(s)</b>
          <p class="mut">Messages enregistrés dans votre espace sécurisé.</p>
        </div>
        <button type="button" class="s" id="clos-refresh">Actualiser</button>
      </div>
      <div class="row clos-message-layout" style="align-items:flex-start">
        <aside id="clos-thread-list">
          ${conversations.map(c => `
            <button type="button" data-open-conv="${c.id}">
              <b>${esc(c.subject || 'Demande de contact')}</b><br>
              <small class="mut">${esc(c.status || 'Ouverte')} · ${dtFull(c.updated_at || c.created_at)}</small>
            </button>`).join('') || '<p class="mut">Aucune conversation pour le moment.</p>'}
        </aside>
        <section id="clos-thread"><p class="mut">Sélectionnez une conversation pour afficher les messages.</p></section>
      </div>
    </div>`;
}

/* Affichage d'une conversation */
async function closRenderThread(cid, canReply = true) {
  const thread = $('#clos-thread');
  if (!thread) return;
  try {
    const { data: conv, error: ce } = await sb.from('conversations')
      .select('id,subject,status,customer_id,assigned_to').eq('id', cid).single();
    if (ce) throw ce;
    const msgs = await closGetMessages(cid);
    thread.innerHTML = `<h3>${esc(conv.subject || 'Discussion')}</h3>
      <p class="mut">Statut : ${esc(conv.status || 'ouverte')}</p>
      <div id="clos-message-log" style="max-height:440px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--bg)">
        ${msgs.map(m => `
          <div style="max-width:88%;margin:8px ${m.sender_id === me.id ? '0 0 8px auto' : '0 auto 8px 0'};padding:10px 12px;border-radius:12px;background:${m.sender_id === me.id ? '#e5efe7' : '#fff'}">
            <div>${esc(m.body).replace(/\n/g, '<br>')}</div>
            <small class="mut">${dtFull(m.created_at)} ${m.sender_id === me.id ? '· Vous' : ''}</small>
          </div>`).join('') || '<p class="mut">Aucun message.</p>'}
      </div>
      ${canReply ? `<form id="clos-send-message" style="margin-top:12px">
        <label>Votre message<textarea name="body" rows="3" maxlength="5000" required placeholder="Écrivez votre message…"></textarea></label>
        <button type="submit">Envoyer le message</button>
      </form>` : ''}`;

    const log = $('#clos-message-log');
    if (log) log.scrollTop = log.scrollHeight;

    const form = $('#clos-send-message');
    if (form) form.onsubmit = async e => {
      e.preventDefault();
      const body = new FormData(form).get('body').trim();
      if (!body) return;
      const b = form.querySelector('button');
      b.disabled = true;
      const { error } = await sb.from('messages').insert({ conversation_id: cid, sender_id: me.id, body });
      if (error) { alert('Envoi impossible : ' + error.message); b.disabled = false; return; }
      await sb.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', cid);
      await closRenderThread(cid, canReply);
    };
  } catch (e) {
    thread.innerHTML = '<div class="card err">Conversation inaccessible : ' + esc(e.message) + '</div>';
  }
}

/* Inbox générique */
async function renderInbox(title) {
  try {
    const conv = await closGetConversations();
    app.innerHTML = `<h1>${esc(title)}</h1>
      <p class="clos-page-intro">Retrouvez vos échanges, ouvrez une discussion ou démarrez une nouvelle conversation.</p>
      ${conv.length
        ? closMessageShell('Mes conversations', conv) + await closStartForm()
        : await closStartForm() + closMessageShell('Mes conversations', conv)}`;

    const form = $('#clos-new-conversation');
    if (form) form.onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      try {
        const id = await closCreateConversation(f.subject, f.body, null, f.recipient_id);
        await renderInbox(title);
        await closRenderThread(id, true);
      } catch (x) { alert(x.message); }
    };
    document.querySelectorAll('[data-open-conv]').forEach(b => b.onclick = () => closRenderThread(b.dataset.openConv, true));
    const r = $('#clos-refresh');
    if (r) r.onclick = () => renderInbox(title);
  } catch (e) {
    app.innerHTML = `<h1>${esc(title)}</h1>
      <div class="card err">
        <b>La messagerie n’est pas encore disponible.</b><br>
        ${esc(e.message)}<br><br>
        Vérifiez que les tables <code>conversations</code> et <code>messages</code> existent dans Supabase
        et que les politiques RLS autorisent la lecture/écriture.
      </div>`;
  }
}

/* Point d'entrée : redirige selon le rôle */
function renderMessages() {
  if (prof?.role === 'dev') return renderInbox('Messagerie (supervision)');
  return renderInbox('Messagerie');
}