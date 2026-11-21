function renderFaq() {
  document.title = 'FAQ — ' + (CFG.name || DEF.name);
  const rows = [
    ['Comment trouver un animal ?',
     'Depuis l’accueil, parcourez les familles animales ou utilisez la recherche pour retrouver une annonce.'],
    ['Comment poser une question sur une annonce ?',
     'Créez un compte client ou connectez-vous, puis ouvrez la messagerie. Les clients peuvent contacter les vendeurs.'],
    ['Puis-je contacter plusieurs vendeurs ?',
     'Oui, un client peut ouvrir une conversation avec un vendeur disponible dans la liste des contacts.'],
    ['Comment suivre une réservation ?',
     'Une fois votre compte associé à un animal, les informations disponibles apparaissent dans votre espace client.'],
    ['Comment devenir vendeur ?',
     'Le rôle vendeur est attribué par l’administration du site. Il ne peut pas être choisi lors d’une inscription publique.'],
    ['Qui peut voir les conversations ?',
     'Les personnes participant à une conversation y ont accès. L’éleveur et le développeur disposent également des droits de supervision prévus par le site.'],
    ['Comment est géré l’acompte ?',
     'Un acompte de ' + ACOMPTE + ' € est demandé sous 7 jours. Il confirme la réservation et est imputé sur le prix total.'],
    ['Quels documents sont remis avec l’animal ?',
     'L’animal est identifié (puce électronique) et accompagné de son carnet de santé, de son certificat vétérinaire et de l’attestation de cession.'],
    ['Puis-je visiter l’élevage avant de réserver ?',
     'Oui, contactez l’éleveur par téléphone au 06 48 77 46 37 pour convenir d’un rendez-vous.'],
    ['Puis-je supprimer mon compte ?',
     'Oui, depuis « Mon espace », un bouton « Supprimer mon compte » est disponible. Les contrats signés peuvent être conservés pour des raisons légales.']
  ];
  app.innerHTML = pageHero('Les réponses à vos questions', 'Aide & informations',
    'Quelques repères pour utiliser le site et préparer votre projet.')
    + `<div class="clos-faq">
        ${rows.map(([q, a]) => `<details class="card"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
      </div>
      <section class="card">
        <h2>Une autre question ?</h2>
        <p>Notre équipe peut vous orienter.</p>
        <a href="#/contact"><button type="button">Nous contacter</button></a>
      </section>`;
}