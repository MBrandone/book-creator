---
name: technical-scoping
description: Cadrage de sujets techniques - analyse et documentation des décisions d'architecture, méthodologies, et outils qui modifient comment le logiciel est développé
triggers:
  - "cadrage technique"
  - "sujet technique"
  - "décision technique"
  - "choix technique"
  - "architecture"
---

# Technical Scoping

## Overview

Cadrer un sujet technique avant l'implémentation permet de documenter le raisonnement, d'identifier les risques, et de créer un référentiel pour l'équipe et les futurs agents. Un bon cadrage technique capture le *pourquoi* d'une décision technique et les alternatives considérées.

## When to Apply

**Use this skill when:**
- Introducing a new tool, library, or framework
- Changing development methodology or process
- Modifying build, deployment, or CI/CD pipeline
- Adopting new code standards or conventions
- Restructuring the architecture or codebase organization
- Making infrastructure or hosting decisions
- Any technical change that affects *how* the team works, not *what* features users get

**Do NOT use for:**
- Product features that change user experience
- Bug fixes without architectural impact
- Routine maintenance or dependency updates
- Throwaway prototypes or experiments

## Requirements

When applying this skill, you MUST:

1. **Ask clarification questions** - Do not assume. Gather complete information before documenting
2. **Document alternatives** - Every decision must show what was rejected and why
3. **Identify measurable success criteria** - How will you know if this worked?
4. **Assess team impact** - Learning curve, skills required, disruption expected
5. **Create a permanent record** - Write a document in `docs/technical/` that guides implementation
6. **Link to methodology sources** - Reference books, articles, or frameworks that inspired the approach

### Clarification Questions Framework

Ask the user these questions systematically:

#### Problem Definition
- What specific problem does this technical change solve?
- What is the pain point with the current approach?
- Who is affected by this problem? (developers, CI/CD, deployment, all of the above?)
- What happens if we do nothing?

#### Methodology & Inspiration
- What methodology, pattern, or practice inspires this change?
- Are there industry standards or best practices we should follow?
- Have other teams or companies solved this problem? How?

#### Tools & Implementation
- What specific tools, libraries, or frameworks will be used?
- What are the alternatives? Why choose this one over others?
- What are the dependencies or prerequisites?

#### Impact & Constraints
- What technical constraints apply? (performance, compatibility, scalability)
- What are the measurable success criteria? (metrics, thresholds, KPIs)
- What does "done" look like?

#### Risk & Rollback
- What are the risks? How can they be mitigated?
- What is the rollback plan if this doesn't work?
- What is the cost of adoption vs. cost of status quo?
- Are there breaking changes or migration requirements?

## Document Structure

After gathering information, create a document at `docs/technical/YYYY-MM-DD-topic-name.md`:

```markdown
# Technical Scoping: [Topic Name]

## Metadata
- **Date**: YYYY-MM-DD
- **Status**: Proposed | Accepted | In Progress | Completed
- **Owner**: [Person/Team responsible]
- **Related**: [Links to ADRs, issues, PRs]

## Problem Statement

Clear, concise description of the problem this technical change solves.
What is broken or inefficient with the current approach?

## Context & Constraints

- Timeline constraints
- Performance requirements
- Compatibility requirements
- Budget or resource constraints

## Methodology & Inspiration

What guides this approach?
- Methodology (e.g., TDD, Domain-Driven Design, Microservices)
- Industry standards or frameworks
- Examples from other teams/companies

Include references and links.

## Proposed Solution

### Tools & Technologies
- Primary tool/library: [Name + version]
- Alternative considered: [Name] - rejected because [reason]
- Alternative considered: [Name] - rejected because [reason]

### Implementation Approach
High-level steps. Not detailed code, but architectural phases.

### Dependencies & Prerequisites
What must be in place before starting?

## Implementation Tasks

Liste détaillée et actionnable des tâches nécessaires à l'implémentation. Chaque tâche doit être :
- **Concrète** : un développeur (ou un agent) peut la prendre et savoir quoi faire
- **Vérifiable** : critère clair pour dire "c'est fait"
- **Ordonnée** : respecter les dépendances entre tâches

### Phase 1: [Nom de la phase, ex: Préparation]
- [ ] **T1.1** - [Description de la tâche] — *Dépend de: -*
  - Critère de complétion : [ce qui doit être vrai]
  - Fichiers/zones concernés : [chemins]
- [ ] **T1.2** - [Description] — *Dépend de: T1.1*
  - Critère de complétion : [...]

### Phase 2: [Nom de la phase, ex: Implémentation cœur]
- [ ] **T2.1** - [Description] — *Dépend de: T1.2*
- [ ] **T2.2** - [Description] — *Dépend de: -*

### Phase 3: [Nom de la phase, ex: Validation & rollout]
- [ ] **T3.1** - Écrire les tests couvrant [...] 
- [ ] **T3.2** - Mettre à jour la documentation ([fichiers])
- [ ] **T3.3** - Vérifier les critères de succès (voir section Success Criteria) 

## Impact Analysis

### Team Impact
- Learning curve: [Low | Medium | High]
- Skills required: [List]
- Estimated disruption: [Hours/Days]
- Training needed: [Yes/No - details]

### Technical Impact
- Performance: [Expected change]
- Scalability: [Expected change]
- Maintainability: [Expected change]
- Code changes: [Scope]

## Success Criteria

Measurable outcomes:
- [ ] Metric 1: [Threshold]
- [ ] Metric 2: [Threshold]
- [ ] Definition of "done"

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [How to prevent/reduce] |
| [Risk 2] | High/Med/Low | High/Med/Low | [How to prevent/reduce] |

## Rollback Plan

If this doesn't work:
1. Step 1 to revert
2. Step 2 to revert
3. Recovery time estimate

## Cost Analysis

- **Cost of adoption**: [Time, money, disruption]
- **Cost of status quo**: [Ongoing pain, tech debt, inefficiency]
- **Break-even point**: [When does this pay off?]

## Timeline

- Research & validation: [Duration]
- Implementation: [Duration]
- Migration (if applicable): [Duration]
- Stabilization: [Duration]

## Open Questions

- [ ] Question 1?
- [ ] Question 2?

## Decision

[To be filled after discussion]

**Accepted** | **Rejected** | **Deferred**

Rationale: [Why this decision was made]
```

## Examples

### Good Example: Adopting Deno for Backend Scripts

```markdown
# Technical Scoping: Migrate Node.js Scripts to Deno

## Problem Statement
Our build scripts use Node.js with 15+ dependencies requiring manual management.
npm security audits show vulnerabilities. Scripts fail in CI due to missing deps.

## Methodology & Inspiration
- Inspired by "Secure by Default" principle (OWASP guidelines)
- Deno philosophy: https://deno.com/blog/philosophy
- Example from Linear engineering blog on build tooling

## Proposed Solution
### Tools & Technologies
- Primary: Deno 2.x
- Alternative: Bun - rejected (less mature, smaller ecosystem)
- Alternative: Stay with Node - rejected (doesn't solve security/deps issues)

### Implementation
1. Audit all scripts in /scripts
2. Rewrite top 5 critical scripts to Deno
3. Update CI pipeline
4. Document migration guide for remaining scripts

## Implementation Tasks

### Phase 1: Préparation
- [ ] **T1.1** - Inventorier tous les scripts dans `/scripts` et lister leurs dépendances npm — *Dépend de: -*
  - Critère de complétion : tableau `scripts × deps` publié dans le doc
- [ ] **T1.2** - Installer Deno 2.x sur l'environnement de dev et documenter le setup — *Dépend de: -*
  - Critère de complétion : `deno --version` fonctionne pour toute l'équipe

### Phase 2: Migration
- [ ] **T2.1** - Réécrire `build.js` en `build.ts` (Deno) — *Dépend de: T1.2*
  - Fichiers/zones : `/scripts/build.*`
- [ ] **T2.2** - Réécrire `deploy.js` en `deploy.ts` (Deno) — *Dépend de: T1.2*
- [ ] **T2.3** - Mettre à jour le pipeline CI pour utiliser `deno task` — *Dépend de: T2.1, T2.2*

### Phase 3: Validation & rollout
- [ ] **T3.1** - Vérifier que le CI passe sans étape `npm install` pour les scripts — *Dépend de: T2.3*
- [ ] **T3.2** - Écrire un guide de migration pour les scripts restants dans `docs/technical/` — *Dépend de: T2.3*
- [ ] **T3.3** - Valider les critères de succès (voir section Success Criteria) — *Dépend de: T3.1*

## Success Criteria
- [ ] Zero npm dependencies for build scripts
- [ ] CI passes without dependency installation step
- [ ] No security vulnerabilities in script dependencies
```

### Bad Example: Vague Tool Adoption

```markdown
# We should use React

We need React because everyone uses it.

## Tools
- React

## Why
It's popular and has good documentation.
```

**What's wrong:**
- No problem statement (what does React solve?)
- No alternatives considered
- No methodology or inspiration cited
- No success criteria
- No implementation plan
- No team impact assessment

## Verification Checklist

Before finalizing the technical scoping document:

- [ ] **Problem clearly stated** - Anyone reading understands what pain this solves
- [ ] **Alternatives documented** - At least 2 alternatives with rejection rationale
- [ ] **Methodology cited** - References to books, articles, or frameworks
- [ ] **Tools specified** - Exact versions and configuration approach
- [ ] **Implementation tasks listed** - Tâches concrètes, vérifiables, ordonnées, regroupées en phases
- [ ] **Success criteria measurable** - Specific metrics, not vague goals
- [ ] **Team impact assessed** - Learning curve, skills, disruption quantified
- [ ] **Risks identified** - With mitigation strategies
- [ ] **Rollback plan exists** - Clear steps to revert if needed
- [ ] **Cost analysis complete** - Adoption cost vs. status quo cost
- [ ] **Document placed in `docs/technical/`** - Dated and named clearly
- [ ] **Status set** - Proposed, Accepted, In Progress, or Completed

## Post-Scoping Actions

After the document is created and approved:

1. **Create an ADR** if this is an architectural decision (use documentation-and-adrs skill)
2. **Update CLAUDE.md** with new conventions or standards
3. **Create implementation tasks** based on the timeline

## Common Anti-Patterns

| Anti-Pattern | Why It Fails | Better Approach |
|--------------|--------------|-----------------|
| "We'll figure it out as we go" | No rollback plan, unclear success | Scope first, then implement |
| "Everyone else uses X" | No context for your needs | Analyze requirements, then choose |
| "It's just a small change" | Underestimating impact | Always document technical changes |
| "We can switch later if needed" | Lock-in and migration cost ignored | Consider exit strategy upfront |
| Copying without understanding | Doesn't fit your constraints | Learn the *why*, adapt the *how* |