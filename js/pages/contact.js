function renderContact() {
  document.title = 'Contact — ' + (CFG.name || DEF.name);
  app.innerHTML = pageHero('Parlons de votre projet', 'Contact & renseignements',
    'Une question sur une annonce, l’élevage ou les conditions d’accueil ? Choisissez le moyen de contact qui vous convient.')
    + `<div class="clos-contact-grid">
        <section class="card clos-contact-card">
          <h2>Par téléphone</h2>
          <p>Pour un échange direct avec l’élevage.</p>
          <p><a href="tel:0648774637"><b>06 48 77 46 37</b></a></p>
        </section>
        <section class="card clos-contact-card">
          <h2>Par messagerie</h2>
          <p>Gardez un historique de vos questions et des réponses.</p>
          ${me
            ? '<a href="#/messages"><button type="button">Accéder à la messagerie</button></a>'
            : '<a href="#/compte"><button type="button">Créer un compte client</button></a>'}
        </section>
        <section class="card clos-contact-card">
          <h2>Avant de nous écrire</h2>
          <p>Consultez les réponses aux questions les plus fréquentes.</p>
          <a href="#/faq">Consulter la FAQ</a>
        </section>
      </div>`;
}