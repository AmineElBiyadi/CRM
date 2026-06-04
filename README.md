# Rawabet
## CRM Alimenté par IA pour Agences Immobilières
**Description Complète du Projet · Architecture · Acteurs · Intégrations**

---

## 1. Présentation du Projet

Rawabet est une plateforme de Gestion de la Relation Client (CRM) alimentée par IA, spécifique au secteur immobilier, conçue exclusivement pour les agences immobilières.

Contrairement aux solutions CRM génériques, Rawabet est construite autour des flux de travail réels des agences immobilières : gestion des profils acheteurs et vendeurs, suivi des visites et négociations, génération et signature de contrats, et clôture des dossiers.

La plateforme est construite comme une application Spring Boot monolithique modulaire, où chaque module gère un domaine métier distinct et communique en interne via des appels de méthodes Java directs ou des Spring Events asynchrones. Un moteur IA alimenté par Spring AI et les modèles **NVIDIA NIM** (via le protocole OpenAI) fournit une analyse intelligente, un scoring des leads, des réponses aux questions sur les documents, et une génération automatisée de rapports. Les e-mails transactionnels (bienvenue, réinitialisation de mot de passe, contrats) sont gérés directement via **SendGrid**, tandis que les processus métier répétitifs et les alertes complexes peuvent être automatisés via **n8n**.

Le système sert trois rôles distincts côté utilisateur — Admin, Agent et Client — chacun avec sa propre interface et ses permissions. Chaque dossier client appartient à l'agence, et non aux agents individuels, assurant la continuité des activités même en cas de changement de personnel.

---

## 2. Acteurs & Rôles

La plateforme définit trois rôles distincts avec des responsabilités et des niveaux d'accès clairement séparés.

| Rôle | Qui Ils Sont | Ce Qu'Ils Peuvent Faire | Ce Qu'Ils Ne Peuvent Pas Faire |
|---|---|---|---|
| Admin | Le directeur de l'agence | Gérer les comptes agents, réaffecter les clients, configurer les automatisations, intervenir sur les dossiers bloqués, consulter toutes les analyses et rapports IA | Traiter les interactions clients individuelles au quotidien |
| Agent | Le commercial | Gérer les clients assignés, journaliser les interactions, planifier les visites, rechercher des annonces immobilières, utiliser tous les outils IA, rédiger et envoyer des contrats | Voir les clients des autres agents en mode édition, changer son propre rôle |
| Client | Acheteur ou vendeur | Consulter la chronologie de son dossier, téléverser des documents, télécharger des contrats, discuter avec l'assistant IA sur son dossier | Voir les données d'un autre client ou toute information interne à l'agence |

### 2.1 Admin (Directeur d'Agence)

L'Admin est un utilisateur métier, pas technique. Il utilise l'interface principale de la plateforme avec un ensemble d'autorisations élevées. Il gère l'agence dans son ensemble : ses collaborateurs, la santé de son pipeline et ses règles d'automatisation.

**Gestion des agents**

- Créer de nouveaux comptes agents, définir leur nom, coordonnées et rôle.
- Désactiver un compte agent lorsqu'une personne quitte l'agence sans supprimer ses données historiques.
- Consulter la charge de travail actuelle de chaque agent : nombre de clients actifs, dossiers à chaque étape du pipeline et date de dernière activité.
- Réaffecter en masse tous les clients d'un agent partant à un ou plusieurs agents actifs, le système journalisant automatiquement chaque événement de réaffectation dans l'historique des interactions du client.
- Réaffecter temporairement des dossiers urgents spécifiques (leads chauds, négociations actives) lorsqu'un agent est en congé, et annuler la réaffectation à son retour.

**Supervision et intervention sur le pipeline**

- Consulter un tableau de bord global du pipeline affichant chaque dossier actif pour tous les agents, regroupés par étape (Froid, Tiède, Chaud, Négociation, Clôturé, Perdu).
- Envoyer une alerte interne directement à l'agent responsable depuis le tableau de bord lorsqu'un dossier semble bloqué, par exemple un lead chaud sans interaction depuis plus de deux semaines.
- Mettre à jour manuellement l'étape d'un dossier, ajouter une note à un dossier client ou corriger une interaction journalisée lorsqu'un agent est indisponible ou a commis une erreur.
- Marquer un dossier client comme urgent, ce qui le fixe en haut du tableau de bord de l'agent responsable et déclenche une notification n8n à l'agent.

**Configuration des automatisations**

- Définir les règles métier qui pilotent les workflows n8n sans toucher au code : le nombre de jours d'inactivité déclenchant une alerte de lead froid, les modèles d'e-mails pour l'intégration et les rappels de réunion, et l'agent de secours par défaut pour les leads entrants non assignés.
- Activer ou désactiver des workflows d'automatisation individuels (par exemple, désactiver temporairement les e-mails de rapport hebdomadaire pendant une période de vacances).
- Consulter le journal d'exécution des automatisations pour voir quels workflows ont été exécutés, quand et pour quels clients.

**Analytique et rapports**

- Lire le rapport PDF hebdomadaire généré par IA livré chaque lundi matin, couvrant la progression des dossiers, les leads froids, la comparaison des performances des agents et les actions recommandées.
- Accéder à un tableau de bord analytique interactif affichant les taux de conversion par source, la durée moyenne des dossiers, les performances des agents dans le temps et la visualisation de l'entonnoir du pipeline.
- Exporter n'importe quel rapport en PDF pour des présentations internes ou des réunions avec des investisseurs.

### 2.2 Agent (Commercial)

L'Agent est l'utilisateur quotidien principal. La couche IA l'assiste à chaque étape pour optimiser son temps.

**Gestion des profils clients**

- Créer un nouveau profil client avec tous les détails : nom complet, téléphone, e-mail, type (acheteur ou vendeur), fourchette budgétaire, préférences immobilières (type, superficie, préférence d'étage, quartier), source d'acquisition (recommandation, Google, réseaux sociaux, passage en agence) et agent assigné.
- Le système crée automatiquement un compte de portail client lors de la création du profil et envoie les identifiants au client par e-mail via n8n.
- Consulter un dossier client complet à tout moment : informations personnelles, résumé généré par IA, score de lead, historique complet des interactions, propriétés liées, documents téléversés et statut du contrat.

**Gestion du pipeline de leads**

- Chaque client progresse à travers les étapes du pipeline : Froid → Tiède → Chaud → Négociation → Clôturé → Perdu. Les agents peuvent mettre à jour l'étape manuellement à tout moment.
- Le moteur IA suggère automatiquement une mise à jour d'étape basée sur la fréquence des interactions, leur récence et l'activité documentaire, mais l'agent confirme toujours ou annule la suggestion.
- Le tableau de bord de l'agent affiche tous ses clients classés par score de lead IA, avec des indicateurs d'urgence codés par couleur et un libellé « action recommandée » pour chacun.

**Journalisation des interactions**

- Journaliser chaque point de contact client comme une interaction : appel téléphonique, visite immobilière, échange d'e-mails, réunion en personne ou note interne.
- Chaque entrée de journal comprend le type d'interaction, la date et l'heure, la durée (pour les appels) et une description en texte libre.
- Le moteur IA lit tous les journaux d'interactions en temps réel et maintient un résumé en langage naturel continuellement mis à jour en haut du dossier client.

**Recherche et liaison de propriétés**

- Rechercher des annonces immobilières en direct depuis l'API Propriétés externe directement dans le dossier client, filtrées par le budget du client, le type de propriété et la zone préférée.
- Prévisualiser les détails d'une annonce (photos, superficie, étage, prix, adresse sur Google Maps) sans quitter la plateforme.
- Lier une ou plusieurs propriétés à un profil client en un seul clic. Les propriétés liées sont sauvegardées localement afin de persister même si l'annonce externe est supprimée.
- Demander une recommandation de propriété par IA : le moteur IA analyse les préférences déclarées du client et son historique d'interactions, interroge l'API et retourne les trois annonces les plus pertinentes avec une justification écrite pour chacune.

**Gestion des rendez-vous**

- Planifier un rendez-vous avec un client : définir la date, l'heure, le type (visite immobilière, appel téléphonique, rendez-vous en agence, signature de contrat) et lier une adresse de propriété le cas échéant.
- Au moment de la création d'un rendez-vous, un workflow n8n se déclenche automatiquement : une invitation Google Calendar est envoyée à l'agent et au client, et un e-mail de rappel est mis en file pour 24 heures avant le rendez-vous.
- Après l'heure prévue du rendez-vous, n8n envoie à l'agent une invite automatisée pour journaliser ses notes de réunion dans l'historique des interactions du client.

**Outils IA**

- Lire le score de lead généré par IA (0 à 100) avec une explication en langage naturel du raisonnement et de l'action suivante recommandée, mis à jour automatiquement après chaque interaction.
- Poser à l'IA des questions en langage naturel sur les documents téléversés d'un client : éligibilité de revenus, complétude des documents ou analyse du profil financier.
- Générer un brouillon d'e-mail de suivi personnalisé en un clic : l'IA lit l'historique du client, la dernière interaction et les propriétés liées, et produit un e-mail prêt à réviser que l'agent peut modifier et envoyer directement depuis la plateforme via SendGrid.

**Gestion des contrats**

- Créer un contrat directement dans le dossier client en remplissant un formulaire guidé : détails de la propriété, prix convenu, montant du dépôt de garantie, calendrier de paiement et dates clés.
- Le brouillon de contrat est immédiatement analysé par le moteur IA, qui retourne un résumé des risques signalant toutes les clauses inhabituelles, sections manquantes ou incohérences avant que l'agent ne l'envoie.
- Envoyer le contrat au client via son portail en un clic. Le client reçoit une notification par e-mail et peut le télécharger, le signer et le retéléverser via son portail.
- Suivre le statut du contrat en temps réel : Brouillon → Envoyé → Reçu Signé → Archivé. Chaque changement de statut déclenche une notification n8n aux parties concernées.

### 2.3 Client (Acheteur ou Vendeur)

Le client interagit exclusivement avec son propre portail personnel, qui est une application frontend distincte se connectant au même backend mais n'exposant que les données propres au client. Le portail est conçu pour être simple et rassurant : le client sait toujours exactement où en est son dossier.

**Chronologie du dossier**

- Consulter une chronologie de chaque événement dans son dossier : profil créé, e-mail de bienvenue envoyé, visite immobilière effectuée, offre soumise, contrat envoyé, contrat signé.
- Chaque événement affiche la date, une courte description et le nom de l'agent responsable.

**Suivi des propriétés**

- Parcourir toutes les propriétés que son agent a liées à son dossier, avec tous les détails et photos.
- Voir quelles propriétés ont été visitées, lesquelles sont en cours d'examen et lesquelles ont été écartées.

**Gestion des documents**

- Téléverser les documents requis (certificat de revenus, relevés bancaires, carte nationale d'identité, justificatif de domicile) directement depuis le portail, depuis n'importe quel appareil y compris mobile.
- Télécharger les contrats et documents officiels partagés par l'agent à tout moment.
- Recevoir une notification de confirmation à chaque fois qu'un document est bien reçu par l'agence.

**Chatbot assistant IA**

- Discuter avec un assistant IA directement dans le portail. L'assistant est conscient du contexte : il peut répondre aux questions sur le processus d'achat immobilier, expliquer à quoi sert chaque document et décrire la prochaine étape attendue dans son dossier spécifique.
- L'assistant utilise le RAG (Génération Augmentée par Récupération) : il lit les documents téléversés par le client et la base de connaissances de la plateforme pour donner des réponses ancrées dans leur situation réelle, pas des réponses génériques.
- Exemples de questions auxquelles l'assistant peut répondre : « Quels documents dois-je encore téléverser ? », « Que se passe-t-il après la signature du contrat ? », « Mon revenu est-il suffisant pour cette propriété sur la base de ce que j'ai téléversé ? »

---

## 3. Architecture Monolithique

La plateforme est construite comme une application Spring Boot monolithique modulaire, déployée en une seule unité. Elle est organisée en quatre modules métier distincts — Auth, CRM Core, Moteur IA et Notification — chacun encapsulant son propre domaine de responsabilité, mais s'exécutant dans le même processus JVM. La communication entre modules s'effectue par des appels de méthodes Java directs pour les opérations synchrones, et via Spring Events pour les traitements asynchrones internes (par exemple, déclencher un recalcul de score en arrière-plan après une interaction). La sécurité JWT est gérée directement par Spring Security au niveau de l'application, sans passerelle externe.

### 3.1 Module Auth

Responsable de toute la logique d'authentification et d'autorisation au sein de l'application. Aucun autre module n'accède directement aux identifiants utilisateurs.

- Émet des tokens d'accès JWT à la connexion et des tokens de rafraîchissement pour la continuité de session.
- Valide les tokens sur chaque requête entrante via un filtre Spring Security global.
- Gère trois rôles utilisateurs : ADMIN, AGENT, CLIENT.
- Gère la création de mot de passe pour les nouveaux comptes agents et clients.

### 3.2 Module CRM Core

Le module le plus grand et le plus central de l'application. Il possède toutes les entités métier et expose l'API REST consommée par le tableau de bord des agents et le portail client.

- Gère tous les profils clients, étapes du pipeline, journaux d'interactions, réunions, propriétés et contrats comme des entités JPA persistées dans PostgreSQL.
- Publie des événements de domaine via Spring Events lorsque des changements d'état significatifs surviennent : `CLIENT_CREATED`, `MEETING_SCHEDULED`, `CONTRACT_SENT`, `CONTRACT_SIGNED`, `LEAD_STAGE_CHANGED`. Ces événements sont écoutés directement par les autres modules au sein du même contexte applicatif.
- Appelle le module Moteur IA de manière asynchrone (via un Spring Event traité dans un thread séparé) à chaque changement de données d'interaction, pour déclencher un recalcul de score en arrière-plan sans bloquer l'interface de l'agent.
- Expose un endpoint de recherche qui interroge l'API Propriétés externe, met les résultats en cache localement et retourne des données immobilières enrichies avec une URL Google Maps.
- Gère les téléversements de fichiers (documents, contrats signés) en stockant les fichiers binaires et en persistant les métadonnées (nom de fichier, horodatage du téléversement, rôle du téléverseur, référence client) dans la base de données.

### 3.3 Module Moteur IA

Un module entièrement dédié à toutes les fonctionnalités IA et analytiques de l'application. Construit avec Spring AI, il appelle les modèles **NVIDIA NIM** pour l'inférence et utilise pgvector pour la recherche sémantique.

- **Scoring des leads** : Reçoit une charge utile de données client, construit un prompt structuré, appelle le LLM et retourne un score (0–100) plus une explication en langage naturel.
- **Résumé des interactions** : Génère un résumé de 2 à 3 phrases mis à jour après chaque nouvelle interaction.
- **RAG Documentaire** : Lorsqu'un client téléverse un document, le service extrait le texte, le divise en morceaux, génère des embeddings vectoriels via l'API NVIDIA NIM et les stocke dans pgvector. Les agents peuvent ensuite interroger les documents clients en langage naturel.
- **Recommandation immobilière** : Interroge l'API Propriétés et demande au LLM de classer les meilleures correspondances.
- **Analyse des risques contractuels** : Lit le texte d'un contrat PDF et retourne une liste structurée de clauses signalées ou de sections manquantes.
- **Génération du rapport hebdomadaire** : Agrège les données de la semaine écoulée pour tous les clients et agents et produit un rapport Markdown structuré que le Module de Notification convertit en PDF.

### 3.4 Module Notification

Gère toutes les communications sortantes et les alertes système.

- Écoute les événements de domaine publiés par les modules CRM Core et Moteur IA via Spring Events, et associe chaque type d'événement à une action : envoyer un e-mail via SendGrid, appeler un webhook n8n ou envoyer une notification in-app.
- Expose des endpoints webhook que n8n appelle lorsqu'il doit déclencher une action dans la plateforme (par exemple, marquer un rappel comme envoyé dans le journal des interactions).
- Convertit les rapports IA hebdomadaires de Markdown en PDF à l'aide d'une bibliothèque de rendu côté serveur et joint le PDF à l'e-mail sortant.

---

## 4. APIs Externes & Intégrations

### 4.1 API de Listings Immobiliers (RapidAPI)

Il s'agit de la principale source de données externe requise pour le projet. Le Module CRM Core effectue des requêtes HTTP vers une API de listings immobiliers disponible sur RapidAPI (telle que « Realty in US », « Zameen Pakistan API » ou une API de portail immobilier marocain). L'intégration fonctionne comme suit :

- L'agent effectue une recherche immobilière directement depuis le dossier d'un client. Le CRM Core envoie une requête GET à l'API de listings avec des filtres : ville, type de propriété, nombre de chambres, prix minimum et maximum.
- L'API retourne une liste paginée d'objets propriété contenant le prix, l'adresse, la superficie, le nombre de pièces, l'étage, les photos disponibles et une URL d'annonce.
- L'agent prévisualise les résultats dans la plateforme. Lorsqu'il lie une propriété, l'objet propriété complet est sauvegardé localement dans PostgreSQL afin de persister indépendamment de l'API externe.
- Le Moteur IA appelle également cette API directement lors de la génération de recommandations immobilières, utilisant les données du profil client pour construire les paramètres de requête de manière programmatique.

> **Comment cela apparaît sur le CV** : Démontre la capacité à consommer et intégrer une API REST tierce avec authentification, gérer les réponses paginées, mettre en cache les données externes localement pour éviter les appels répétés, et combiner des données externes avec un LLM pour des recommandations intelligentes.

### 4.2 NVIDIA NIM (Moteur IA)

L'API NVIDIA NIM alimente toutes les fonctionnalités du modèle de langage dans le service Moteur IA. Spring AI est utilisé comme couche d'abstraction, ce qui signifie que le fournisseur de modèle sous-jacent peut être remplacé par un autre fournisseur compatible OpenAI en changeant simplement la configuration.

- **Complétions de chat (LLM via NVIDIA NIM)** : utilisées pour le scoring des leads, le résumé des interactions et la justification des recommandations immobilières. Chaque appel est structuré avec un prompt système soigneusement conçu et un prompt utilisateur construit à partir de contenu réel de la base de données.
- **API Embeddings (Llama 3.2 via NVIDIA NIM)** : utilisée pour convertir les morceaux de texte des documents en représentations vectorielles stockées dans pgvector. Cela alimente le pipeline RAG permettant des requêtes en langage naturel sur les documents clients.
- Tous les appels API sont journalisés avec le nombre de tokens en entrée, le nombre de tokens en sortie, le modèle utilisé et l'horodatage afin que l'Admin puisse surveiller les coûts.

> **Comment cela apparaît sur le CV** : Démontre l'utilisation pratique des APIs LLM avec l'ingénierie de prompts, l'analyse des sorties structurées, la gestion des tokens et la Génération Augmentée par Récupération — parmi les compétences en ingénierie IA les plus demandées en 2025.

### 4.3 n8n (Automatisation des Workflows)

n8n fonctionne comme un service séparé aux côtés de l'application Spring Boot. Il se connecte à la plateforme via des webhooks HTTP exposés par le Module de Notification. Les workflows suivants sont implémentés :

| Déclencheur | Actions automatisées |
|---|---|
| Nouveau client créé | Envoyer un e-mail de bienvenue avec les identifiants du portail via SendGrid. Attendre 3 jours. Envoyer un e-mail de suivi demandant si le client a des questions. Journaliser les deux envois comme événements d'interaction via webhook vers le CRM Core. |
| Réunion planifiée | Envoyer une invitation Google Calendar à l'agent et au client via l'API Google Calendar. Planifier un e-mail de rappel 24 heures avant. Après l'heure du rendez-vous, envoyer à l'agent une invite in-app pour journaliser ses notes. |
| Lead froid (aucun contact depuis plus de 10 jours) | Un cron job nocturne appelle l'API CRM Core pour trouver les leads froids. Pour chacun, envoie à l'agent assigné un e-mail et une alerte in-app avec le nom du client et l'action recommandée. |
| Contrat envoyé au client | Envoyer au client une notification par e-mail avec un lien vers le portail. Ajouter une tâche de suivi pour l'agent dans 5 jours si aucun contrat signé n'est reçu. |
| Contrat signé | Envoyer un e-mail de félicitations au client. Envoyer une notification interne à l'admin. Déclencher le Moteur IA pour marquer le dossier comme CLÔTURÉ. Archiver le PDF signé. |
| Rapport hebdomadaire | Chaque lundi à 08h00, appeler le endpoint de rapport du Moteur IA. Attendre la fin. Joindre le PDF à l'e-mail. Envoyer à l'admin. |
| Nouveau compte agent créé | Envoyer un e-mail de bienvenue au nouvel agent avec un lien de connexion et le guide de la plateforme en PDF joint. |

> **Comment cela apparaît sur le CV** : Démontre la conception d'automatisation de processus de bout en bout, l'intégration par webhooks entre systèmes hétérogènes, la pensée en architecture événementielle et l'utilisation pratique d'un outil d'automatisation no-code/low-code largement adopté dans l'industrie.

### 4.4 API Google Calendar

Appelée par n8n lorsqu'un rendez-vous est planifié dans le CRM. Le workflow n8n utilise un nœud Google Calendar (authentifié OAuth2) pour créer un événement de calendrier avec le titre du rendez-vous, la date, l'heure, le lieu (depuis l'adresse de la propriété liée) et les participants (e-mail de l'agent et e-mail du client). Les deux parties reçoivent une invitation de calendrier standard sur n'importe quel appareil. Aucun code personnalisé n'est nécessaire pour cette intégration — n8n gère nativement le flux OAuth et l'appel API.

### 4.5 API SendGrid

Tous les e-mails transactionnels quittent la plateforme via l'API REST de SendGrid, appelée par le Module de Notification et par n8n. SendGrid est utilisé pour : les e-mails de bienvenue client avec les identifiants du portail, les e-mails de confirmation et de rappel de rendez-vous, les e-mails de notification de contrat, les alertes d'agents pour les leads froids, la livraison du rapport hebdomadaire à l'admin et toute autre communication automatisée. Chaque type d'e-mail utilise un modèle SendGrid pré-conçu afin que l'agence puisse personnaliser le contenu et l'identité visuelle des e-mails sans toucher au code.

### 4.6 API Google Maps (Frontend uniquement)

Utilisée exclusivement dans le frontend React (tableau de bord des agents et portail client). Lorsqu'une propriété est affichée — qu'il s'agisse d'un résultat d'API en direct ou d'une annonce sauvegardée localement — l'adresse de la propriété est affichée sur un widget Google Maps intégré via l'API Maps JavaScript. Les agents peuvent voir l'emplacement exact d'une propriété avant de planifier une visite, et les clients peuvent voir l'emplacement des propriétés liées à leur dossier directement dans leur portail.

---

## 5. Stack Technique & Architecture

| Couche | Technologies |
|---|---|
| **Backend** | Spring Boot 3, Spring AI, Spring Security (JWT), Spring Data JPA, SendGrid API |
| **Base de données** | PostgreSQL 15 + extension **pgvector** |
| **Stockage & Media** | **Cloudinary** (Images & Documents) |
| **Automatisation** | **n8n** auto-hébergé pour les rappels et alertes complexes |
| **Frontend** | React 18, Tailwind CSS, TanStack Router |
| **IA** | NVIDIA NIM (GPT-OSS-20B/120B, Llama 3.2 Embeddings) |
| **Données Immobilières** | RapidAPI (Zillow/Realty) |
| **Ports (Local)** | Front Agent: **5176**, Front Client: 5174, Backend: **8081**, n8n: 5678 |

---

## 6. Pitch du Projet pour CV & Soutenance

**Pitch en une phrase**

Un CRM alimenté par IA spécifique au secteur immobilier, construit sur une architecture Spring Boot monolithique modulaire, offrant un scoring des leads et une analyse documentaire pilotés par LLM via RAG (NVIDIA NIM), une automatisation complète des processus métier via n8n, une intégration de listings immobiliers en direct et un portail dédié aux clients.

**Ce que chaque technologie démontre**

- **Architecture** : Spring Boot monolithique modulaire : décomposition en modules métier, communication interne via appels directs et Spring Events, sécurité JWT intégrée via Spring Security.
- **Ingénierie IA** : Spring AI + NVIDIA NIM : intégration pratique de LLM, ingénierie de prompts, analyse des sorties structurées, pipeline RAG avec pgvector.
- **Automatisation** : n8n + SendGrid + webhooks : conception d'automatisation événementielle, intégration entre systèmes hétérogènes, pensée processus métier.
- **Sécurité** : Spring Security + JWT : contrôle d'accès basé sur les rôles (Admin, Agent, Client), isolation des données, gestion du cycle de vie des tokens.
- **Intégration API** : Consommation d'API externes : intégration d'API RESTful (RapidAPI, Cloudinary), enrichissement des données, gestion des erreurs.
- **Frontend** : React (deux applications) + Tailwind + TanStack Router : capacité full-stack, réflexion UX, conception d'interface adaptée aux rôles.
