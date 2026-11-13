# Documentation UML — ENI Mail

> Plateforme de messagerie interne de l'École Nationale d'Informatique (Madagascar).
> Documentation de conception conforme UML 2.5, en appui au code effectivement présent dans ce dépôt.

---

## 1. Présentation

Cette documentation réunit l'ensemble des artefacts de conception UML du projet **ENI Mail**. Chaque fichier est autonome et peut être lu séparément. Les diagrammes sont majoritairement en **Mermaid** (rendu natif sur GitHub) et en **PlantUML** pour les représentations UML les plus formelles.

Elle est destinée à :
- Préparer la soutenance de projet de fin d'année (jury universitaire).
- Documenter l'architecture pour la maintenance et l'évolution.
- Tracer la couverture des exigences du cahier des charges par le code livré.

---

## 2. Table des matières et ordre de lecture recommandé

| # | Fichier | Objet | Pourquoi le lire |
|---|---------|-------|------------------|
| 00 | [00-index.md](00-index.md) | Index général. | Point d'entrée de la documentation. |
| 01 | [01-analyse-et-conception.md](01-analyse-et-conception.md) | Contexte, problématique, acteurs, exigences fonctionnelles et non fonctionnelles, règles métier, choix d'architecture. | Donne la vision d'ensemble et justifie les choix. |
| 02 | [02-diagramme-cas-utilisation.md](02-diagramme-cas-utilisation.md) | Diagramme de cas d'utilisation + fiches textuelles détaillées par cas. | Cartographie les fonctionnalités offertes aux acteurs. |
| 03 | [03-diagramme-classes.md](03-diagramme-classes.md) | Modèle métier UML (classes, attributs, méthodes, associations). | Comprendre les entités manipulées et leurs relations. |
| 04 | [04-diagramme-objets.md](04-diagramme-objets.md) | Instances concrètes illustrant des scénarios réels. | Rendre le modèle de classes concret. |
| 05 | [05-diagrammes-sequence.md](05-diagrammes-sequence.md) | 20 diagrammes de séquence des interactions clés. | Comprendre les enchaînements entre couches. |
| 06 | [06-diagrammes-activite.md](06-diagrammes-activite.md) | 10 diagrammes d'activité des processus métier. | Comprendre les workflows avec décisions et alternatives. |
| 07 | [07-diagrammes-etats-transitions.md](07-diagrammes-etats-transitions.md) | Cycle de vie du message, de l'utilisateur et de la session. | Modéliser les états des entités dans le temps. |
| 08 | [08-diagramme-composants.md](08-diagramme-composants.md) | Composants logiciels et interfaces. | Vue technique du système décomposé. |
| 09 | [09-diagramme-deploiement.md](09-diagramme-deploiement.md) | Déploiement physique (dev + prod). | Comprendre où tourne quoi. |
| 10 | [10-diagramme-packages.md](10-diagramme-packages.md) | Organisation backend (Spring) et frontend (React). | Traçabilité du code source. |
| 11 | [11-modele-donnees-mongodb.md](11-modele-donnees-mongodb.md) | Collections, attributs BSON, index, exemples JSON. | Référence NoSQL concrète. |
| 12 | [12-diagramme-architecture-generale.md](12-diagramme-architecture-generale.md) | Diagramme d'architecture technique global. | Vue synthétique pour un comité technique. |
| 13 | [13-matrice-tracabilite.md](13-matrice-tracabilite.md) | Matrice « exigences ↔ acteurs ↔ cas d'usage ↔ classes ↔ endpoints ↔ tests ». | Vérifier qu'aucune exigence n'est orpheline. |

### Ordre de lecture pour un lecteur pressé (jury, enseignant)

1. [01-analyse-et-conception.md](01-analyse-et-conception.md) — comprendre le quoi et le pourquoi.
2. [12-diagramme-architecture-generale.md](12-diagramme-architecture-generale.md) — vue à 10 000 pieds.
3. [02-diagramme-cas-utilisation.md](02-diagramme-cas-utilisation.md) — ce que fait le logiciel.
4. [11-modele-donnees-mongodb.md](11-modele-donnees-mongodb.md) — modèle de persistance.
5. [13-matrice-tracabilite.md](13-matrice-tracabilite.md) — couverture des exigences.

### Ordre de lecture pour un développeur qui reprend le projet

1. [10-diagramme-packages.md](10-diagramme-packages.md) — où se trouve quoi.
2. [08-diagramme-composants.md](08-diagramme-composants.md) — dépendances techniques.
3. [03-diagramme-classes.md](03-diagramme-classes.md) + [11-modele-donnees-mongodb.md](11-modele-donnees-mongodb.md) — modèle.
4. [05-diagrammes-sequence.md](05-diagrammes-sequence.md) — comprendre les flux.
5. [09-diagramme-deploiement.md](09-diagramme-deploiement.md) — exécution.

---

## 3. Conventions

- **Classes et attributs** : notation UML 2.5 (`+` public, `-` privé, `~` package, `#` protégé). Dans un contexte Spring Data, `-` représente les attributs encapsulés (Lombok `@Data`).
- **Multiplicités** : `1`, `0..1`, `*`, `1..*`, `n` (n borné).
- **Associations** : trait plein = association, losange plein = composition, losange creux = agrégation, flèche creuse = généralisation.
- **Fragments séquence** : `alt`, `opt`, `loop`, `par`, `ref`.
- **Terminologie** : on parle de **« document MongoDB »** pour les entités persistées (collection `users`, `messages`, etc.) et de **« classe UML »** pour la représentation abstraite.
- **Langue** : français sauf noms techniques (identifiants, classes Java).

---

## 4. Statut d'implémentation (synthèse)

La matrice complète figure dans [13-matrice-tracabilite.md](13-matrice-tracabilite.md). Résumé :

| Module | Statut | Remarque |
|--------|:------:|----------|
| Authentification JWT + refresh cookie | ✅ Implémenté | Tests unitaires `JwtServiceTest`, `LoginAttemptServiceTest`. |
| Gestion des utilisateurs (CRUD + rôles) | ✅ Implémenté | Endpoint `/api/users`. |
| Messagerie (envoi, lecture, réponse, transfert) | ✅ Implémenté | État lu/supprimé **par destinataire**. |
| Dossiers Inbox/Sent/Drafts/Trash | ✅ Implémenté | Compteurs sur `/api/messages/folders/counts`. |
| Pièces jointes (upload + download sécurisé) | ✅ Implémenté | MIME whitelist, UUID, anti-path-traversal. |
| Groupes de diffusion | ✅ Implémenté | Dédoublonnage automatique des destinataires. |
| Recherche plein texte | ✅ Implémenté | Index texte MongoDB sur subject+body. |
| Tableau de bord administrateur | ✅ Implémenté | Statistiques agrégées. |
| Rate-limit anti-brute force | ✅ Implémenté | `LoginAttemptService` en mémoire. |
| Tests d'intégration end-to-end | ⚠️ Partiel | Tests unitaires OK ; test de contexte Spring `@Disabled` par défaut. |
| Déploiement production (HTTPS + MongoDB auth) | 📄 Documenté | Configuration à durcir pour la mise en production. |

Légende : ✅ Implémenté — ⚠️ Partiellement implémenté — 🚧 En cours — 📄 Documenté mais non déployé — ❌ Non implémenté.

---

## 5. Figures UML rendues

Chaque fichier de ce dossier embarque désormais les **diagrammes rendus par PlantUML** (format figure PNG + SVG vectoriel + source `.puml` modifiable), en plus du bloc Mermaid d'origine pour l'édition rapide sur GitHub.

- **36 figures PNG** + **36 figures SVG** générées.
- **Sources PlantUML** : [`sources/`](sources/) (style commun [`sources/_style.iuml`](sources/_style.iuml)).
- **Images rendues** : [`diagrams/png/`](diagrams/png/) et [`diagrams/svg/`](diagrams/svg/).
- **Guide de régénération** : [`diagrams/README.md`](diagrams/README.md).

Les diagrammes suivent le style **Visual Paradigm** : fond blanc, palette sobre (bleus marine), formes UML conventionnelles (acteurs stick, classes compartimentées, flèches UML standards), moteur de layout **Smetana** (pas de dépendance Graphviz).

## 6. Entrée dans le code

Pour chaque élément UML, vous retrouverez un lien direct vers le fichier source correspondant, par exemple :

- Classe `User` : [eni-mail-back/src/main/java/mg/eni/email/document/User.java](../../eni-mail-back/src/main/java/mg/eni/email/document/User.java)
- Contrôleur `MessageController` : [eni-mail-back/src/main/java/mg/eni/email/controller/MessageController.java](../../eni-mail-back/src/main/java/mg/eni/email/controller/MessageController.java)
- Page de connexion React : [eni-mail-frontend/src/features/auth/LoginPage.tsx](../../eni-mail-frontend/src/features/auth/LoginPage.tsx)

Cela permet de valider que chaque diagramme reflète bien le code réel.



back .\mvnw.cmd spring-boot:run
front npm run dev