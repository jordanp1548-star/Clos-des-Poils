async function renderLegalDoc(k) {
  const { data } = await sb.from('settings').select('*').eq('key', k).maybeSingle()
    .then(r => r, () => ({ data: null }));
  const ok = data?.validated;
  document.title = DOCS[k].t + ' — ' + (CFG.name || DEF.name);
  app.innerHTML = `<h1>${DOCS[k].t}</h1>
    ${ok
      ? `<p class="mut">Version validée le ${dt(data.validated_at)}</p>`
      : '<p class="tag">Brouillon en attente de validation</p>'}
    ${fmt(L(ok ? data.value : DOCS[k].x))}`;
}

async function renderTextes() {
  try {
    const { data } = await sb.from('settings').select('*');
    const m = Object.fromEntries((data || []).map(r => [r.key, r]));
    app.innerHTML = '<h1>Textes légaux</h1>'
      + '<p class="mut">Relisez chaque texte, complétez les variables, puis validez.</p>'
      + Object.entries(DOCS).map(([k, d]) => `
        <form class="card" data-k="${k}">
          <h3>${d.t} ${m[k]?.validated
            ? `<span class="tag">Validé le ${dt(m[k].validated_at)}</span>`
            : '<span class="tag">À valider</span>'}</h3>
          <textarea name="x" style="min-height:300px">${esc(m[k]?.value || d.x)}</textarea><br>
          <button>Valider et publier</button>
        </form>`).join('');

    document.querySelectorAll('form[data-k]').forEach(f => f.onsubmit = async e => {
      e.preventDefault();
      const { error } = await sb.from('settings').upsert({
        key: f.dataset.k,
        value: f.x.value,
        validated: true,
        validated_at: new Date().toISOString(),
        validated_by: me.id
      });
      if (error) alert(error.message); else renderTextes();
    });
  } catch (e) {
    app.innerHTML = '<div class="card err">' + esc(e.message) + '</div>';
  }
}