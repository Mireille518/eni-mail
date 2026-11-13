# Figures UML — ENI Mail

Ce dossier contient les diagrammes UML **rendus** par PlantUML.

- `png/` — aperçus matriciels (lecture directe sur GitHub, intégration rapport Word / PDF).
- `svg/` — versions vectorielles (impression haute qualité, édition dans Inkscape, intégration slides).

Les **sources éditables** sont dans [`../sources/`](../sources/).

## Régénérer les figures après modification

PlantUML 1.2024.8 est disponible via Maven Central (pas besoin d'installation globale).

### 1. Récupérer PlantUML une seule fois

Depuis la racine du projet :

```powershell
cd eni-mail-back
.\mvnw.cmd -q dependency:copy `
  -Dartifact=net.sourceforge.plantuml:plantuml:1.2024.8 `
  -DoutputDirectory=$env:TEMP\plantuml `
  -Dmdep.stripVersion=true
```

Le JAR est placé dans `%TEMP%\plantuml\plantuml.jar`.

### 2. Lancer le rendu

Depuis `docs/uml/` :

```powershell
# Diagrammes racine
java -jar $env:TEMP\plantuml\plantuml.jar -tpng -o ..\diagrams\png sources\*.puml
java -jar $env:TEMP\plantuml\plantuml.jar -tsvg -o ..\diagrams\svg sources\*.puml

# Sequences
java -jar $env:TEMP\plantuml\plantuml.jar -tpng -o ..\..\diagrams\png\sequence sources\sequence\*.puml
java -jar $env:TEMP\plantuml\plantuml.jar -tsvg -o ..\..\diagrams\svg\sequence sources\sequence\*.puml

# Activites
java -jar $env:TEMP\plantuml\plantuml.jar -tpng -o ..\..\diagrams\png\activity sources\activity\*.puml
java -jar $env:TEMP\plantuml\plantuml.jar -tsvg -o ..\..\diagrams\svg\activity sources\activity\*.puml

# Etats
java -jar $env:TEMP\plantuml\plantuml.jar -tpng -o ..\..\diagrams\png\state sources\state\*.puml
java -jar $env:TEMP\plantuml\plantuml.jar -tsvg -o ..\..\diagrams\svg\state sources\state\*.puml
```

Sous Git Bash / Linux / macOS, remplacer `$env:TEMP` par `/tmp` et les `\` par `/`.

## Style

Les diagrammes partagent un fichier de style commun :
[`../sources/_style.iuml`](../sources/_style.iuml) — fond blanc, palette sobre (bleus marine + crème), moteur de layout **Smetana** (ne requiert pas Graphviz).

Le style s'inspire de Visual Paradigm : acteurs stick UML, classes compartimentées, flèches UML conventionnelles, absence de dégradés décoratifs.

## Inventaire

| Diagramme | PNG | SVG | Source |
|-----------|-----|-----|--------|
| Cas d'utilisation global | [use-case-global.png](png/use-case-global.png) | [SVG](svg/use-case-global.svg) | [sources/use-case-global.puml](../sources/use-case-global.puml) |
| Diagramme de classes | [class-diagram.png](png/class-diagram.png) | [SVG](svg/class-diagram.svg) | [sources/class-diagram.puml](../sources/class-diagram.puml) |
| Diagramme d'objets | [object-diagram.png](png/object-diagram.png) | [SVG](svg/object-diagram.svg) | [sources/object-diagram.puml](../sources/object-diagram.puml) |
| Composants | [component-diagram.png](png/component-diagram.png) | [SVG](svg/component-diagram.svg) | [sources/component-diagram.puml](../sources/component-diagram.puml) |
| Déploiement | [deployment-diagram.png](png/deployment-diagram.png) | [SVG](svg/deployment-diagram.svg) | [sources/deployment-diagram.puml](../sources/deployment-diagram.puml) |
| Packages | [package-diagram.png](png/package-diagram.png) | [SVG](svg/package-diagram.svg) | [sources/package-diagram.puml](../sources/package-diagram.puml) |
| Architecture générale | [architecture-generale.png](png/architecture-generale.png) | [SVG](svg/architecture-generale.svg) | [sources/architecture-generale.puml](../sources/architecture-generale.puml) |
| MongoDB (schéma) | [mongodb-schema.png](png/mongodb-schema.png) | [SVG](svg/mongodb-schema.svg) | [sources/mongodb-schema.puml](../sources/mongodb-schema.puml) |

### Séquences (`diagrams/*/sequence/`)

Authentication · Logout · Create-user · Send-message · Receive-message · Mark-read · Reply · Forward · Save-draft · Send-group · Attachment-upload · Attachment-download · Trash · Restore · Delete-permanent · Search · Admin-dashboard (17 diagrammes).

### Activités (`diagrams/*/activity/`)

Authentication · Send-message · Receive-message · Attachment-flow · Delete-restore · User-management (6 diagrammes).

### États-transitions (`diagrams/*/state/`)

Message-document · Message-recipient · User-lifecycle · Session-lifecycle · Refresh-token-lifecycle (5 diagrammes).

**Total : 36 PNG + 36 SVG.**
