# Todo
- Remettre des logs sur la génération d'images
- Avoir un vrai provider de scène qui se base sur un LLM en prod (pas du in-memory)
- Mettre une photo de couverture servant de base à la suite
- Les générations de photos se basent sur la première génération.
- documenter les endpoints (y a pas de swagger comment faire mieux ?)
- Spécialiser autour de thème : Fete des mères, fete des pères, Noël, Paques
- Faire un bouton commander : Combien serais-tu prêt à payer pour ce livre ?
- Un personnage est décorellé d'une histoire, 
  - je peux associer jusque 5 personnages à l'histoire
  - Je peux utiliser des personnages crée précédemment
  - Avoir des personnages ré-utilisables dans mes histoires
- Avoir un compte
- Brancher/débrancher facilement les modèles de génération d'histoire (Mock, Ollama, Replicate)
  - Par les variables d'environnement ?
- Idée docker => Créer un nouvelle image perso ollama avec des modèles déjà installé dessus (plutôt qu'un deuxième container qui va installer)

# Doing
- Mieux gérer les variables d'environnements

# Done
- [X] Déployer sur Vercel et Supabase
- [X] Expliciter un service de creation d'image
- [X] Sortir des command handlers pour chaque endpoint API
  - [X] POST /stories
  - [X] POST stories/{id}/characters 
  - [X] POST stories/{id}/generate 
  - [X] GET stories/{id}/status => GET stories/{id}/generation 
  - [X] GET stories/{id}
- [X] Créer des repo pour les requêtes BDD
  - StoryRepository (save, get)
  - CharacterRepository (save, get)
  - SceneRepository
- [X] Je peux associer une photo à mon personnage
- [X] Améliorations de je peux associer une photo à mon personnage
  - [X] [Story Generator] Amélioration Les images sont téléchargés et transformés en bases 64 à chaque génération
    - Elle ne devrait l'être qu'un seule fois
  - [X] Supprimer la demo page des composants
  - [X] l'upload de photo se fait en même temps que les infos des personnages
- [X] Landing Page
- [X] Mieux gérer les variables d'environnements
