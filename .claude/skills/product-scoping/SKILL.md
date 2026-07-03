# Méthodologie : Rédaction de spécifications techniques

Ce guide décrit la méthodologie à suivre pour cadrer et spécifier de nouvelles fonctionnalités de manière collaborative et structurée.

---

## Objectif

Produire des spécifications techniques complètes et actionnables en posant les bonnes questions au bon moment, tout en explorant le contexte technique existant.

---

## Processus en 5 étapes

### 📖 Étape 1 : Exploration du contexte

**Objectif** : Comprendre l'architecture existante et le domaine métier

**Actions** :
1. Lire les documents de référence (`SPECS.md`, `README.md`, etc.)
2. Explorer le code existant pertinent :
   - Modèles de domaine
   - Repositories
   - Services/Command Handlers
   - API endpoints
   - Schéma de base de données
3. Identifier les patterns architecturaux utilisés

**Questions à se poser** :
- Quelle est l'architecture actuelle ? (DDD, CQRS, layered, etc.)
- Quels sont les concepts métier clés ?
- Quelles sont les conventions de nommage et d'organisation du code ?
- Quelles technologies sont utilisées ? (frameworks, bibliothèques, services externes)

**Outils** :
- `read_file` pour lire la documentation et le code
- `list_code_definition_names` pour avoir une vue d'ensemble
- `search_files` pour trouver des patterns spécifiques

**Livrable** : Compréhension solide du contexte technique et métier

---

### 🎯 Étape 2 : Clarification des besoins

**Objectif** : Obtenir une compréhension claire et non ambiguë de ce que l'utilisateur souhaite

**Approche** : Poser des questions ciblées **une par une** pour éviter de submerger l'utilisateur

**Framework de questions** :

#### A. Questions sur le flux utilisateur
- Comment l'utilisateur va-t-il accéder à cette fonctionnalité ?
- Quelles sont les étapes du parcours utilisateur ?
- Quelles validations ou contraintes doivent être respectées ?

#### B. Questions sur l'intégration technique
- Comment cette fonctionnalité s'intègre-t-elle avec l'existant ?
- Quelles API externes ou services tiers sont nécessaires ?
- Y a-t-il des contraintes techniques à respecter ?

#### C. Questions sur les données
- Quelles données doivent être stockées ?
- Où et comment doivent-elles être stockées ?
- Y a-t-il des besoins de migration des données existantes ?

#### D. Questions sur les dépendances externes
- Des services externes sont-ils requis ?
- Comment fonctionnent ces services ? (consulter la documentation si nécessaire)
- Quelles sont leurs limites/contraintes ?

#### E. Questions sur l'interface graphique
- Quel interface utilisateur permet d'utiliser ces APIs ?

**Principe clé** : **Une question à la fois**
- Présenter 2-5 options de réponse pour faciliter le choix
- Permettre à l'utilisateur de répondre "Je ne sais pas" pour que vous proposiez une solution
- Documenter chaque décision avec sa justification

**Exemple de séquence** :
```
Question 1 : Upload des données
├─ Option A : Dans le même appel API
├─ Option B : Séparément via un nouvel endpoint
└─ Option C : Les deux options possibles

↓ Réponse obtenue

Question 2 : Stockage des données
├─ Option A : Base de données relationnelle
├─ Option B : Stockage objet (S3)
└─ Option C : Autre système

↓ Réponse obtenue

... et ainsi de suite
```

**Livrable** : Décisions architecturales claires et documentées

---

### 🔍 Étape 3 : Recherche technique

**Objectif** : Valider la faisabilité et comprendre les APIs/services externes

**Actions** :
1. Consulter la documentation des services tiers
2. Vérifier les contraintes techniques (limites d'API, formats supportés, etc.)
3. Explorer des exemples d'implémentation si disponibles
4. Identifier les pièges potentiels

**Outils** :
- `execute_command` avec `curl` pour tester des APIs
- Recherche dans la documentation en ligne
- Lecture de code d'exemple

**Questions à valider** :
- La solution proposée est-elle techniquement faisable ?
- Quelles sont les limites techniques à prendre en compte ?
- Y a-t-il des meilleures pratiques à suivre ?

**Livrable** : Validation technique et identification des contraintes

---

### 🏗️ Étape 4 : Proposition de solution

**Objectif** : Proposer une architecture optimale basée sur les contraintes identifiées

**Structure de la proposition** :

#### A. Contexte et objectifs
- Résumé du besoin
- Objectifs clairs et mesurables

#### B. Décisions architecturales
Pour chaque décision majeure :
- **Décision** : Ce qui a été décidé
- **Raison** : Pourquoi cette décision
- **Alternatives considérées** : Ce qui n'a pas été retenu et pourquoi
- **Contraintes** : Limites techniques à respecter

#### C. Spécifications fonctionnelles
- Cas de tests détailles en utilisant le Behaviour Driven Development et le framework given when then
- Se mettre dans la peau de l'utilisateur d'interface (pas celui qui utilise les APIs)

#### D. Spécifications techniques
1. **API REST** : Endpoints, payloads, codes de réponse
2. **Modèle de données** : Modifications du schéma
3. **Architecture logicielle** : Nouveaux composants, interfaces
4. **Intégrations externes** : Configuration, paramètres
5. **Gestion des erreurs** : Scénarios d'échec et récupération

#### E. Sécurité et considérations
- Validation des entrées
- Authentification/Autorisation
- Protection des données sensibles
- Quotas et rate limiting

#### F. Plan de déploiement
- Phases de développement
- Migrations de base de données
- Tests requis
- Stratégie de rollout

**Principe clé** : **Équilibre entre détail et pragmatisme**
- Assez de détails pour implémenter sans ambiguïté
- Focus sur les décisions importantes

**Livrable** : Document de spécifications complet

---

### ✅ Étape 5 : Validation et itération

**Objectif** : S'assurer que les specs répondent aux attentes et sont complètes

**Actions** :
1. Présenter le document de specs
2. Demander un feedback
3. Identifier les zones d'ombre ou points manquants
4. Itérer si nécessaire

**Questions de validation** :
- Les objectifs sont-ils bien définis et mesurables ?
- Les décisions architecturales sont-elles justifiées ?
- Le plan de déploiement est-il réaliste ?
- Les cas limites sont-ils couverts ?
- Les dépendances sont-elles identifiées ?

**Livrable** : Spécifications validées et prêtes pour l'implémentation

---

## Template de document de specs

Voici le template à utiliser pour structurer vos spécifications :

```markdown
# Cadrage : [Nom de la fonctionnalité]

## Contexte
[Description du contexte métier et technique]

## Objectifs
- Objectif 1
- Objectif 2
- Objectif 3

## Décisions architecturales

### 1. [Aspect décisionnel 1]
**Décision** : [La décision prise]
**Raison** : [Justification]
**Contraintes** : [Limites techniques]

### 2. [Aspect décisionnel 2]
...

---

## Spécifications fonctionnelles

### Flow utilisateur mis à jour
1. Étape 1
2. Étape 2
3. **[NOUVEAU]** Étape nouvelle
4. Étape 3

---

## Spécifications techniques

### 1. API REST

#### [Nom de l'endpoint]
\`\`\`
[Method] [Path]
Content-Type: [type]

Body:
[structure]

Response [code]:
[structure]
\`\`\`

### 2. Modifications du schéma de base de données
\`\`\`typescript
[Code des modifications]
\`\`\`

### 3. [Autres sections techniques]
...

---

## Sécurité et considérations

### Sécurité
- Point 1
- Point 2

### Performance
- Point 1
- Point 2

### Nettoyage des données
- Point 1
- Point 2

---

## Plan de déploiement

### Phase 1 : [Nom] (Sprint N)
- [ ] Tâche 1
- [ ] Tâche 2

### Phase 2 : [Nom] (Sprint N+1)
- [ ] Tâche 1
- [ ] Tâche 2

---

## Questions ouvertes / À décider
1. Question 1
2. Question 2

---

## Références
- [Lien 1]
- [Lien 2]
```

---

## Bonnes pratiques

### ✅ À faire

1. **Explorer avant de spécifier**
   - Lire le code existant
   - Comprendre les patterns en place
   - Identifier les contraintes techniques

2. **Poser une question à la fois**
   - Éviter de submerger l'utilisateur
   - Fournir des options de réponse
   - Documenter chaque décision

3. **Valider la faisabilité technique**
   - Consulter les documentations des APIs
   - Tester les intégrations si possible
   - Identifier les limites tôt

4. **Justifier les décisions**
   - Chaque décision doit avoir une raison
   - Mentionner les alternatives considérées
   - Être transparent sur les compromis

5. **Penser à la maintenance**
   - Gestion des erreurs
   - Monitoring et métriques
   - Nettoyage des données
   - Migration et déploiement

6. **Rester pragmatique**
   - Commencer simple (MVP)
   - Planifier les évolutions futures
   - Équilibrer perfection et livraison

### ❌ À éviter

1. **Ne pas explorer le contexte**
   - Spécifier sans comprendre l'existant
   - Ignorer les conventions en place

2. **Poser trop de questions d'un coup**
   - Bombarder l'utilisateur
   - Questions trop techniques sans contexte

3. **Assumer sans valider**
   - Supposer qu'une API fonctionne d'une certaine manière
   - Ne pas vérifier les contraintes techniques

4. **Sur-spécifier**
   - Trop de détails d'implémentation
   - Enlever toute flexibilité

5. **Sous-spécifier**
   - Manquer les cas limites
   - Oublier la gestion des erreurs
   - Ignorer la sécurité

6. **Oublier l'opérationnel**
   - Pas de plan de déploiement
   - Pas de métriques
   - Pas de stratégie de monitoring

---

## Checklist finale

Avant de finaliser un document de specs, vérifier :

### Complétude fonctionnelle
- [ ] Les objectifs sont clairement définis
- [ ] Le flow utilisateur est complet (cas nominal + erreurs)
- [ ] Les cas limites sont identifiés
- [ ] Les validations métier sont spécifiées

### Complétude technique
- [ ] Tous les endpoints API sont spécifiés
- [ ] Les modifications de schéma de base de données sont documentées
- [ ] Les intégrations externes sont détaillées
- [ ] La gestion des erreurs est couverte

### Décisions et justifications
- [ ] Chaque décision architecturale est justifiée
- [ ] Les alternatives ont été considérées
- [ ] Les contraintes techniques sont documentées
- [ ] Les compromis sont explicités

### Sécurité et qualité
- [ ] La validation des entrées est spécifiée
- [ ] L'authentification/autorisation est couverte
- [ ] Les quotas et limites sont définis
- [ ] Les tests à effectuer sont listés

### Opérations
- [ ] Le plan de déploiement est détaillé
- [ ] Les migrations sont documentées
- [ ] Les métriques de succès sont définies
- [ ] Le monitoring est considéré

### Documentation
- [ ] Le document est bien structuré
- [ ] Les références externes sont incluses
- [ ] Les questions ouvertes sont listées
- [ ] Le langage est clair et non ambigu

---

## Exemples

### Exemple : Séquence de questions pour "Upload de fichier"

**Question 1 : Quand uploader ?**
```
L'utilisateur va-t-il uploader le fichier :
A) En même temps que la création de l'entité (même requête)
B) Après avoir créé l'entité (requête séparée)
C) Les deux options doivent être possibles

→ Décision : B (requête séparée)
→ Raison : Séparation des responsabilités, flexibilité
```

**Question 2 : Où stocker ?**
```
Le fichier doit être stocké :
A) En base de données (BLOB)
B) Sur un système de fichiers local
C) Sur un stockage objet (S3/MinIO)
D) Autre système

→ Décision : C (S3/MinIO)
→ Raison : Scalabilité, intégration existante
```

**Question 3 : Validation ?**
```
Quelles validations appliquer sur le fichier :
A) Type de fichier uniquement
B) Type + taille
C) Type + taille + contenu (scan antivirus)

→ Décision : B (type + taille pour la v1)
→ Raison : Bon compromis sécurité/simplicité
→ Évolution : Ajouter scan antivirus en v2
```

---

## Outils et ressources

### Pour l'exploration
- `read_file` : Lire les fichiers de code et documentation
- `list_code_definition_names` : Vue d'ensemble de l'architecture
- `search_files` : Rechercher des patterns spécifiques
- `list_files` : Explorer la structure du projet

### Pour la validation technique
- `execute_command` : Tester des APIs, outils CLI
- Documentation en ligne des services tiers
- Exemples de code et tutoriels

### Pour la collaboration
- `ask_followup_question` : Poser des questions ciblées
- Proposer des options multiples
- Itérer sur les réponses

---

## Conseils d'expert

1. **Commencez large, puis affinez**
   - Vue d'ensemble → Détails
   - Contexte → Décisions → Implémentation

2. **Utilisez des diagrammes si pertinent**
   - Flow charts pour les processus
   - Diagrammes de séquence pour les interactions
   - Schémas d'architecture pour la vue système

3. **Pensez en itérations**
   - V1 : MVP fonctionnel
   - V2 : Améliorations et optimisations
   - V3+ : Features avancées

4. **Anticipez les questions**
   - "Que se passe-t-il si... ?"
   - "Comment gérer le cas où... ?"
   - "Quelle est la limite de... ?"

5. **Documentez les "pourquoi"**
   - Le "quoi" et le "comment" évoluent
   - Le "pourquoi" reste pertinent

6. **Soyez un facilitateur**
   - Aidez l'utilisateur à clarifier sa pensée
   - Proposez des solutions quand il hésite
   - Challengez gentiment les hypothèses

---

## Conclusion

Cette méthodologie vise à produire des spécifications techniques de qualité de manière collaborative et structurée. L'objectif est d'équilibrer :

- **Rigueur** : Couvrir tous les aspects importants
- **Pragmatisme** : Ne pas sur-spécifier, rester actionable
- **Collaboration** : Impliquer l'utilisateur dans les décisions
- **Clarté** : Produire une documentation compréhensible et non ambiguë

**Principe directeur** : Les meilleures specs sont celles qui permettent à une équipe de développer la fonctionnalité avec confiance, tout en laissant de la place pour les décisions d'implémentation détaillées.
