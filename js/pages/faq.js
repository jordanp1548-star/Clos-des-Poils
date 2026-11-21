function renderFaq() {
  document.title = 'FAQ — ' + (CFG.name || DEF.name);
  const rows = [
    ['Comment trouver un animal ?',
     'Depuis l’accueil, choisissez une famille dans la liste ou tapez un nom, une race ou une espèce. « Plus d’informations » ouvre la fiche complète.'],
    ['Comment réserver un animal ?',
     'Créez un compte client, puis cliquez sur « Demander une réservation » sur l’annonce. L’éleveur accepte ou refuse votre demande ; sa réponse apparaît dans « Mon espace ».'],
    ['Comment est géré l’acompte ?',
     'Un acompte de ' + ACOMPTE + ' € est demandé sous 7 jours après l’acceptation de votre demande. Il confirme la réservation et est imputé sur le prix total.'],
    ['Comment suivre ma réservation ?',
     'Dans « Mon espace » : l’état de votre demande, les dates, les contrats à signer, les paiements, puis la fiche et les photos de votre animal.'],
    ['Quels documents sont remis avec l’animal ?',
     'L’animal est identifié (puce électronique) et accompagné de son carnet de santé, de son certificat vétérinaire et de l’attestation de cession.'],
    ['Puis-je visiter l’élevage avant de réserver ?',
     'Oui, contactez l’éleveur par téléphone au 06 48 77 46 37 pour convenir d’un rendez-vous.'],
    ['Comment poser une question sur une annonce ?',
     'Connectez-vous avec votre compte client, puis ouvrez la messagerie. Les clients peuvent contacter les vendeurs.'],
    ['Puis-je contacter plusieurs vendeurs ?',
     'Oui, un client peut ouvrir une conversation avec chaque vendeur disponible dans la liste des contacts.'],
    ['Qui peut voir les conversations ?',
     'Les personnes participant à une conversation y ont accès. L’éleveur et le développeur disposent également des droits de supervision prévus par le site.'],
    ['Comment devenir vendeur ?',
     'Le rôle vendeur est attribué par l’administration du site. Il ne peut pas être choisi lors d’une inscription publique.'],
    ['Puis-je supprimer mon compte ?',
     'Oui, depuis « Mon espace », un bouton « Supprimer mon compte » est disponible. Les contrats signés peuvent être conservés pour des raisons légales.']
  ];
  app.innerHTML = pageHero('Questions fréquentes', '',
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