function renderLogin(sign = false) {
  document.title = (sign ? 'Créer mon compte' : 'Connexion') + ' — ' + (CFG.name || DEF.name);
  app.innerHTML = `
    <div class="card" style="max-width:520px;margin:0 auto">
      <h2>${sign ? 'Créer mon compte' : 'Connexion'}</h2>
      <form id="f">
        ${sign
          ? '<label>Prénom<input name="prenom" required maxlength="60"></label>' +
            '<label>Nom<input name="nom" required maxlength="60"></label>' +
            '<label>Téléphone<input name="tel" type="tel" maxlength="20"></label>'
          : ''}
        <label>E-mail<input name="email" type="email" required autocomplete="email"></label>
        <label>Mot de passe${sign ? ' (10 caractères minimum)' : ''}
          <input name="pw" type="password" minlength="${sign ? 10 : 1}" required
                 autocomplete="${sign ? 'new-password' : 'current-password'}">
        </label>
        ${sign
          ? '<label><input type="checkbox" name="ok" required style="width:auto;margin-right:6px"> Je suis majeur(e) et j’accepte le <a href="#/reglement" target="_blank">règlement</a> et la <a href="#/confidentialite" target="_blank">politique de confidentialité</a>.</label>'
          : ''}
        <p id="m" class="err"></p>
        <button>${sign ? 'Créer mon compte' : 'Se connecter'}</button>
        <button type="button" class="s" id="sw">${sign ? 'J’ai déjà un compte' : 'Créer un compte'}</button>
      </form>
      ${!sign ? `<hr>
        <p class="mut">Les comptes vendeur, éleveur et développeur sont créés par l’administration.
        Une inscription publique crée uniquement un compte client.</p>` : ''}
    </div>`;

  $('#sw').onclick = () => renderLogin(!sign);
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const r = sign
      ? await sb.auth.signUp({
          email: f.email,
          password: f.pw,
          options: { data: { prenom: f.prenom, nom: f.nom, tel: f.tel, consent: new Date().toISOString() } }
        })
      : await sb.auth.signInWithPassword({ email: f.email, password: f.pw });
    if (r.error) {
      $('#m').textContent = r.error.message;
    } else if (sign && !r.data.session) {
      app.innerHTML = '<div class="card">Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.</div>';
    }
  };
}