# Diagramme de cas d'utilisation — ENI Mail

```mermaid
flowchart LR
    Student([Étudiant])
    Teacher([Enseignant])
    Admin([Administrateur])

    subgraph "ENI Mail"
        UC1(Se connecter)
        UC2(Se déconnecter)
        UC3(Consulter son profil)
        UC4(Mettre à jour son profil)

        UC5(Lire ses messages)
        UC6(Composer un message)
        UC7(Répondre / Répondre à tous)
        UC8(Transférer un message)
        UC9(Marquer lu / non lu)
        UC10(Déplacer en corbeille)
        UC11(Restaurer depuis la corbeille)
        UC12(Supprimer définitivement)
        UC13(Enregistrer un brouillon)
        UC14(Rechercher des messages)

        UC15(Joindre des fichiers)
        UC16(Télécharger une pièce jointe)

        UC17(Créer / modifier un groupe)
        UC18(Gérer les membres d'un groupe)
        UC19(Envoyer un message à un groupe)

        UC20(Créer un utilisateur)
        UC21(Désactiver un utilisateur)
        UC22(Attribuer un rôle)
        UC23(Consulter les statistiques)
        UC24(Gérer tous les groupes)
    end

    Student --> UC1 & UC2 & UC3 & UC4
    Student --> UC5 & UC6 & UC7 & UC8 & UC9 & UC10 & UC11 & UC12 & UC13 & UC14
    Student --> UC15 & UC16

    Teacher --> UC1 & UC2 & UC3 & UC4
    Teacher --> UC5 & UC6 & UC7 & UC8 & UC9 & UC10 & UC11 & UC12 & UC13 & UC14
    Teacher --> UC15 & UC16
    Teacher --> UC17 & UC18 & UC19

    Admin --> UC1 & UC2 & UC3 & UC4
    Admin --> UC5 & UC6 & UC7 & UC8 & UC9 & UC10 & UC11 & UC12 & UC13 & UC14
    Admin --> UC15 & UC16
    Admin --> UC17 & UC18 & UC19
    Admin --> UC20 & UC21 & UC22 & UC23 & UC24
```

## Règles d'accès résumées

| Cas d'utilisation | Étudiant | Enseignant | Administrateur |
|---|:---:|:---:|:---:|
| Messagerie standard (envoyer, lire, répondre, rechercher) | OK | OK | OK |
| Créer / éditer un groupe | — | OK | OK |
| Envoi à un groupe | — | OK (ses groupes) | OK (tous) |
| Gestion des utilisateurs | — | — | OK |
| Attribution des rôles | — | — | OK |
| Tableau de bord statistiques | — | — | OK |
