/* ============================================================
   CONFIGURATION GLOBALE
   Modifier uniquement ce fichier pour changer les constantes.
   ============================================================ */

const SB_URL = 'https://xohucwmckmcjqznmfbrs.supabase.co';
const SB_KEY = 'sb_publishable_7xiq-m63V_LGIgVbIhQ5ug_7OEClRCa';

let ELEV = 'Le Clos des Poils';
let ACOMPTE = 300;
let PAYINFO = 'Paiement par virement, Wero ou chèque. Pour obtenir les coordonnées de paiement (IBAN, ordre du chèque, adresse d’envoi), contactez l’éleveur par téléphone au 06 48 77 46 37 (Jordan Pougnet) : il vous les communiquera.';

/* Statuts et catégories (modifiables via /dev) */
let ST = ['À naître','En croissance','Disponible','Réservée','Adopté','Vendue','Père','Mère','Non disponible'];
let CC = { vaccins:'Vaccins', vermifuge:'Vermifuge', antipar:'Antiparasitaires (puces, tiques)', autres:'Autres soins' };
let CT = [
  ['reservation','Contrat de réservation','Entre {eleveur} (l’éleveur) et {acquereur} (l’acquéreur).\n\nL’éleveur réserve à l’acquéreur {animal} ({desc}), né(e) le {naissance}, au prix de {prix}. Un acompte de {acompte} confirme la réservation.'],
  ['sante','Engagement santé de l’animal','L’acquéreur s’engage à faire suivre {animal} par un vétérinaire, à respecter le calendrier de vaccins et de vermifuges, et à prévenir l’éleveur en cas de problème de santé.'],
  ['achat','Conditions d’achat','Le solde est dû avant la remise de {animal}, prévue le {remise}. L’animal est remis identifié et accompagné de ses documents de santé.']
];

/* Valeurs légales par défaut (modifiables via /dev) */
const LEGAL_DEFAULTS = {
  nom: 'Jordan Pougnet — Le Clos des Poils',
  forme: 'Entreprise individuelle',
  siren: '[à compléter : SIREN]',
  siret: '[à compléter : SIRET]',
  adresse: '[à compléter : adresse de l’élevage]',
  email: '[à compléter : email de contact]',
  tel: '06 48 77 46 37',
  directeur: 'Jordan Pougnet',
  hebergeur: 'GitHub Pages (GitHub Inc., 88 Colin P. Kelly Jr. St., San Francisco, CA 94107, USA)',
  region_bdd: 'UE — région Supabase',
  mediateur: '[à compléter : médiateur de la consommation]',
  sort_acompte: 'L’acompte est restitué en cas d’annulation par l’éleveur, ou conservé en cas de désistement de l’acquéreur après signature, sauf accord contraire.',
  age_remise: '8 semaines (conformément à la réglementation)',
  mentions_elevage: 'Élevage familial déclaré. Animaux identifiés (puce électronique) et enregistrés auprès de l’I-CAD.',
  duree_compte: '3 ans après le dernier contact',
  duree_contrats: '10 ans (obligation comptable et légale)',
  service_email: 'Supabase Auth (emails transactionnels)',
  transferts: 'Aucun transfert hors UE en dehors des prestataires listés',
  tva: 'Prix TTC. TVA non applicable, art. 293 B du CGI.',
  points_cgv: 'Délai de rétractation de 14 jours, garanties légales de conformité et des vices cachés, documents remis (carnet de santé, certificat vétérinaire, attestation de cession), modalités de remboursement de l’acompte, recours à un médiateur de la consommation.'
};

/* Modèles de documents légaux */
const DOCS = {
  reglement: { t:'Règlement du site', x:`# 1. Objet
Ce site permet aux acquéreurs de suivre l’animal réservé auprès de {{nom}}. Il ne remplace pas le contrat de vente.

# 2. Compte
Le compte est réservé aux personnes majeures. Les informations fournies doivent être exactes. Les identifiants sont personnels et ne doivent pas être partagés.

# 3. Fiches et suivi de l’animal
Les fiches, soins, vaccins, vermifuges et paiements sont renseignés et modifiés uniquement par l’éleveur. L’acquéreur les consulte en lecture seule et peut signaler une erreur à {{email}}.

# 4. Réservation et acompte
La réservation est enregistrée par l’éleveur. Un acompte de ${ACOMPTE} € est à régler dans les 7 jours. La réservation devient définitive à la signature des contrats en ligne et à réception de l’acompte. Sort de l’acompte en cas d’annulation : {{sort_acompte}}.

# 5. Remise de l’animal
L’animal est remis à l’âge minimum légal {{age_remise}}, identifié et accompagné des documents prévus par la loi.

# 6. Signature électronique
La saisie du nom complet et la case « lu et approuvé » valent signature électronique ; la date et l’heure sont conservées.

# 7. Contenus
Textes et photos appartiennent à l’éleveur et ne peuvent être diffusés sans son accord.

# 8. Responsabilité
Le site est fourni en l’état ; des interruptions sont possibles pour maintenance.

# 9. Données personnelles
Voir la politique de confidentialité.

# 10. Droit applicable et litiges
Droit français. En cas de litige, l’acquéreur consommateur peut recourir gratuitement à un médiateur de la consommation : {{mediateur}}.`},

  mentions: { t:'Mentions légales', x:`# Éditeur
{{nom}}, {{forme}}, SIREN {{siren}}, {{adresse}}, {{email}}, {{tel}}. Directeur de la publication : {{directeur}}.

# Hébergement
Site : {{hebergeur}}. Base de données : Supabase, région {{region_bdd}}.

# Activité d’élevage
{{mentions_elevage}}

# Propriété intellectuelle
Les contenus du site sont protégés. Toute reproduction sans accord est interdite.`},

  confidentialite: { t:'Politique de confidentialité', x:`# Responsable du traitement
{{nom}}, {{adresse}}, {{email}}.

# Données collectées
Identité (prénom, nom), e-mail, téléphone, données de réservation et de suivi de l’animal, paiements enregistrés, signatures électroniques horodatées, date d’acceptation du règlement.

# Finalités et bases légales
Gérer votre compte et la réservation (exécution du contrat) ; respecter les obligations comptables et légales ; assurer la sécurité du site (intérêt légitime).

# Durées de conservation
Compte : durée de la relation puis {{duree_compte}}. Contrats et paiements : {{duree_contrats}}. Après suppression du compte, les contrats signés peuvent être conservés pour ces durées.

# Destinataires
L’éleveur, et nos prestataires techniques : {{hebergeur}}, Supabase, {{service_email}}. Transferts hors UE : {{transferts}}.

# Vos droits
Accès, rectification, effacement, limitation, opposition, portabilité. Depuis « Mon espace » vous pouvez télécharger vos données et supprimer votre compte. Sinon écrivez à {{email}}. Vous pouvez saisir la CNIL (cnil.fr).

# Cookies
Le site utilise uniquement un stockage technique nécessaire à votre connexion. Aucun traceur publicitaire ni de mesure d’audience : aucun bandeau de consentement n’est requis.

# Sécurité
Connexion chiffrée (HTTPS), accès aux données restreint par compte.`},

  cgv: { t:'Conditions de vente', x:`# Conditions générales
Prix : {{tva}}. Les animaux sont vendus selon le contrat de réservation et les conditions d’achat signés en ligne.

# Points à compléter avant publication
{{points_cgv}}`}
};

/* Liste des champs légaux (utilisée par /dev) */
const LK = [
  ['nom','Nom / raison sociale'],['forme','Forme juridique'],['siren','SIREN'],['siret','SIRET'],
  ['adresse','Adresse'],['email','E-mail de contact'],['tel','Téléphone'],
  ['directeur','Directeur de la publication'],['hebergeur','Hébergeur du site'],
  ['region_bdd','Région de la base'],['mediateur','Médiateur de la consommation'],
  ['sort_acompte','Sort de l’acompte'],['age_remise','Âge minimum de remise'],
  ['mentions_elevage','Mentions élevage'],['duree_compte','Durée conservation compte'],
  ['duree_contrats','Durée conservation contrats'],['service_email','Service email'],
  ['transferts','Transferts hors UE'],['tva','TVA'],['points_cgv','Points CGV']
];
const LKM = Object.fromEntries(LK);

/* Config par défaut du site */
const DEF = {
  name: 'Le Clos des Poils',
  hero: 'Élevage familial de chiots, chatons et lapereaux. Retrouvez ici le suivi de votre futur compagnon.',
  colors: {}, css: '', sections: []
};