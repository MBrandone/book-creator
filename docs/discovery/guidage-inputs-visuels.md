# Guidage des inputs utilisateurs pour personnalisation visuelle

## Problem Statement

**Comment pourrions-nous guider les parents à fournir des inputs (descriptions, images) qui génèrent des scénarios et visuels vraiment différenciés et personnalisés ?**

### Contexte actuel
- Les images générées sont souvent très similaires entre elles
- Les utilisateurs (parents créant des histoires pour leurs enfants) donnent des inputs trop génériques
- Mix de problèmes : inputs vagues + système n'exploitant pas bien les détails + utilisateurs ne sachant pas quels détails comptent vraiment
- Contraintes : MVP rapide à développer + budget API limité (coût de génération)
- Succès = augmenter la richesse des inputs fournis par les utilisateurs

---

## Recommended Direction

### Direction 1 : Guidage structuré avant génération (Prioritaire)

Implémenter un **questionnaire visuel interactif** qui guide les parents à spécifier les éléments clés AVANT la génération, en combinant :
- **Questions contextuelles** : lieu, ambiance, couleurs, style artistique
- **Questions émotionnelles** (approche illustrateur) : émotion cible, détails significatifs pour l'enfant

#### Pourquoi cette direction ?

**Valeur utilisateur :**
- Résout directement le problème "je ne sais pas quoi écrire"
- Parents se sentent guidés sans être perdus
- Pas de coût API supplémentaire (une seule génération bien paramétrée)

**Faisabilité technique :**
- Très réalisable en MVP : UI pure (select, color picker, exemples visuels)
- Développement incrémental possible (commencer avec 3 questions, en ajouter progressivement)
- Pas de complexité backend (juste construction d'un prompt enrichi)

**Différenciation :**
- Formuler les questions pour des **parents**, pas des designers professionnels
- Mélange questions techniques (style, couleurs) et émotionnelles (ce qui fera sourire l'enfant)

---

## MVP Scope

### Ce qui est inclus (v1)

**1. Questionnaire de guidage en 5 étapes** (sous la description actuelle de l'histoire) :

```
Étape 1 : "L'histoire se passe..."
→ Choix multiples avec images : forêt enchantée / ville futuriste / sous l'océan / montagne enneigée / etc.

Étape 2 : "L'ambiance générale est..."
→ Choix avec palette de couleurs associée : joyeuse / mystérieuse / apaisante / aventureuse

Étape 3 : "Les couleurs dominantes"
→ Color picker visuel (max 3 couleurs)

Étape 4 : "Le style de dessin ressemble à..."
→ 3-4 exemples visuels d'illustrations (aquarelle douce / anime coloré / dessin simple / photo réaliste)

Étape 5 : "Les détails importants"
→ Liste guidée avec checkboxes/inputs courts :
  - Vêtements particuliers
  - Accessoires significatifs
  - Éléments d'environnement spécifiques
```

**2. Questions complémentaires "côté illustrateur"** (optionnelles, dépliables) :

```
- "Quelle émotion doit ressentir l'enfant en regardant cette image ?"
- "Quels détails vont faire sourire ton enfant ?"
- "Quelle est la chose la plus importante à voir en premier ?"
```

**3. Construction du prompt enrichi :**
- Agrégation des réponses en un prompt structuré pour le générateur d'images
- Template de prompt incluant tous les éléments visuels spécifiés

**4. Exemples de bonnes descriptions :**
- Sous chaque champ de description existant, afficher un exemple concret
- Tooltip/aide contextuelle pour chaque question

### Architecture technique (MVP)

**Frontend (webapp/src/app/create-story/) :**
- Nouveau composant `VisualGuidanceForm` avec les 5 étapes
- State management pour collecter les réponses
- UI shadcn : Select, ColorPicker, RadioGroup avec images

**Backend (modification minimale) :**
- Enrichir le payload de `POST /api/stories/[id]/scenario-generation`
- Passer les paramètres visuels au `ScenarioGeneratorService`
- Template de prompt dans `story-scenes-description-generator`

**Schéma de données (optionnel pour MVP, recommandé pour itération) :**
- Stocker les préférences visuelles dans `stories` (JSON column)
- Permet analytics : quels choix génèrent le plus de satisfaction

---

## Not Doing (and Why)

### ❌ **Direction 2 : Génération puis itération** (pour le moment)
- **Pourquoi :** Coût API trop élevé (2-4 générations par histoire)
- **Quand :** Phase 2, une fois le budget validé et les patterns d'usage compris
- **Alternative MVP :** Limiter à 2 régénérations gratuites si l'utilisateur est insatisfait

### ❌ **Direction 3 : Upload d'image de référence** (pour le moment)
- **Pourquoi :** Complexité technique (vision LLM) + risques légaux (droits d'auteur)
- **Quand :** Phase 2, après validation que Direction 1 ne suffit pas
- **Alternative MVP :** Proposer une galerie d'histoires exemples à "remixer" (plus simple que l'upload)

### ❌ Questionnaire trop long (>5 questions principales)
- **Pourquoi :** Risque de friction, abandon du formulaire
- **Trade-off :** Commencer avec 3 questions essentielles (ambiance/style/couleurs) et ajouter progressivement

### ❌ Génération de multiples variations pour choix
- **Pourquoi :** Budget API x3-4 par histoire
- **Trade-off :** Une seule génération bien paramétrée via le guidage

### ❌ Personnalisation par scène individuelle
- **Pourquoi :** Trop complexe pour un MVP, surcharge cognitive
- **Trade-off :** Paramètres globaux appliqués à toute l'histoire

---

## Key Assumptions to Validate

### 🎯 Hypothèse 1 : Acceptation du questionnaire
**Hypothèse :** Les parents prendront le temps de répondre à 5 questions avant génération.

**Comment tester :**
- Analyser le taux de complétion du questionnaire (combien abandonnent à quelle étape)
- A/B test : version courte (3 questions) vs version complète (5 questions)
- Mesurer le temps moyen passé sur le formulaire

**Critère de succès :** >70% des utilisateurs complètent les 5 questions

---

### 🎯 Hypothèse 2 : Couverture des choix
**Hypothèse :** Les options proposées (lieux, ambiances, styles) couvrent assez de variété pour tous les goûts.

**Comment tester :**
- Tracker l'usage du champ "Autre" si présent
- Interviews utilisateurs : "Ces choix représentent-ils ce que tu imagines ?"
- Analytics : distribution des choix (si une option n'est jamais choisie → supprimer)

**Critère de succès :** <10% des utilisateurs utilisent "Autre" ou champ libre

---

### 🎯 Hypothèse 3 : Efficacité de la traduction prompt
**Hypothèse :** Le système sait traduire ces choix en prompts efficaces qui génèrent des images différenciées.

**Comment tester :**
- Test manuel pré-lancement : 20 combinaisons de réponses → vérifier variété visuelle
- Mesurer la similarité visuelle entre histoires (embedding d'images, distance cosinus)
- Tracker le taux de régénération (si élevé = prompt inefficace)

**Critère de succès :** Taux de similarité visuelle <30% entre histoires différentes

---

### 🎯 Hypothèse 4 : Perception de contrôle
**Hypothèse :** Les utilisateurs sentent que leurs inputs ont un réel impact sur le résultat.

**Comment tester :**
- Survey post-génération : "Tes choix sont-ils reflétés dans l'image ?" (échelle 1-5)
- Taux de régénération réduit (comparé au baseline actuel)
- NPS spécifique à la personnalisation visuelle

**Critère de succès :** Score satisfaction >4/5 sur "mes choix comptent"

---

### 🎯 Hypothèse 5 : Complexité du formulaire
**Hypothèse :** Le formulaire n'est pas perçu comme une "corvée" mais comme une co-création.

**Comment tester :**
- Feedback qualitatif : "Que penses-tu du processus de personnalisation ?"
- Observer si les utilisateurs sautent des questions optionnelles
- Temps moyen sur le formulaire (trop court = bâclé, trop long = friction)

**Critère de succès :** Feedback positif ("c'était amusant/utile") >60%

---

## Open Questions

### 1. **Ordre du formulaire : avant ou après la création de personnages ?**
- **Option A :** Guidage visuel APRÈS avoir ajouté les personnages → peut suggérer des questions basées sur les personnages (ex: "Quelle couleur de vêtement pour [nom personnage] ?")
- **Option B :** Guidage visuel AVANT les personnages → plus logique chronologiquement ("d'abord l'univers, ensuite les habitants")
- **Recommandation :** Tester les deux flows avec 10 utilisateurs

### 2. **Faut-il permettre de modifier les choix après génération ?**
- Si oui, où placer le bouton "Modifier les paramètres visuels" ?
- Cela déclenche-t-il une regénération complète ou juste des ajustements ?

### 3. **Que faire des données collectées ?**
- Stocker les préférences pour pré-remplir le prochain formulaire ?
- Utiliser en analytics pour améliorer les options proposées ?
- Privacy : informer l'utilisateur de cette collecte ?

### 4. **Comment gérer les contradictions ?**
- Exemple : l'utilisateur choisit "ambiance apaisante" + "couleurs vives" (contradiction)
- Le système doit-il alerter ou laisser faire (peut-être c'est voulu) ?

### 5. **Internationalisation des exemples visuels ?**
- Les exemples d'illustrations (step 4) sont-ils culturellement neutres ?
- Faut-il adapter selon la langue/région de l'utilisateur ?

### 6. **Accessibilité du color picker ?**
- Comment les utilisateurs daltoniens vont-ils choisir des couleurs ?
- Faut-il proposer des palettes pré-définies en plus du picker libre ?

---

## Next Steps

### Phase 1 : Validation (2 semaines)
- [ ] Créer des maquettes Figma/wireframes du questionnaire en 5 étapes
- [ ] Tester manuellement 20 combinaisons de réponses → vérifier prompts générés
- [ ] Interview 5 parents : montrer les wireframes, recueillir feedback
- [ ] Décider de l'ordre optimal (guidage avant ou après personnages)

### Phase 2 : Développement MVP (3-4 semaines)
- [ ] Implémenter `VisualGuidanceForm` component (webapp)
- [ ] Intégrer avec le flow existant `create-story/page.tsx`
- [ ] Créer le template de prompt enrichi (backend)
- [ ] Ajouter exemples de descriptions et tooltips
- [ ] Tests E2E du nouveau flow

### Phase 3 : Lancement et mesure (ongoing)
- [ ] Déployer en beta pour 50 premiers utilisateurs
- [ ] Tracker métriques clés : taux de complétion, temps, satisfaction
- [ ] Analyser taux de régénération (avant/après)
- [ ] Itérer sur les options proposées selon usage réel

---

## Variantes explorées (mais non retenues pour MVP)

**Pour mémoire, voici les 8 variations générées lors de l'idéation :**

1. ✅ **Questionnaire guidé (Mad Libs visuel)** → Retenue comme Direction 1
2. **Upload d'images de référence + extraction de style** → Phase 2 (complexité technique)
3. **Presets narratifs** ("Aventure magique", "Douceur du soir") → Peut être combiné avec Direction 1
4. **Montrer 3 exemples visuels d'abord, demander ensuite** → Variante intéressante à tester
5. **3 mots magiques + inférence automatique** → Trop simpliste, risque de manquer de contrôle
6. **Bibliothèque d'histoires partagée + remix** → Phase 3 (nécessite masse critique d'histoires)
7. **Questions d'illustrateur professionnel** → Partiellement intégré dans Direction 1
8. **Apprentissage implicite (4 variations, choix utilisateur)** → Trop coûteux en API pour MVP

---

## Références techniques

**Fichiers clés à modifier :**
- `webapp/src/app/create-story/page.tsx` : Intégrer le nouveau formulaire
- `webapp/src/app/api/stories/[id]/scenario-generation/route.ts` : Enrichir le payload
- `webapp/src/lib/story-scenes-description-generator/` : Template de prompt

**Composants shadcn à utiliser :**
- `Select` (choix multiples)
- `RadioGroup` (avec images custom)
- Color picker (via `@radix-ui/react-color-picker` ou custom)
- `Textarea` (détails optionnels)
- `Card` (présentation des étapes)

**Dépendances potentielles :**
- Librairie color picker : `react-colorful` (léger, 3kb)
- Ou composant shadcn personnalisé avec Radix primitives
