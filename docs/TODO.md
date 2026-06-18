# Todo
- Un personnage est décorellé à une histoire, 
  - je peux associer jusque 5 personnages à l'histoire
  - Je peux utiliser des personnages crée précédemment
- Mettre un swagger
- Refactoring requis
  - Renommer /status en generation
- Les générations de photos se basent sur la première.
- Automatiser le deploiement avec une cli
-
## Idées futures
- Téléverser une photo afin que l'IA génère des images de personnages proches de ces photos
- Les planches générés doivent se baser sur la première planche généré
- Avoir des personnages ré-utilisables dans mes histoires
- Avoir un compte
- Choisir le nombre de scène dans mon histoire
- Brancher/débrancher facilement les modèles de génération d'histoire (Mock, Ollama, Replicate)
- Spécialiser autour de thème : Fete des mères, fete des pères, Noël, Paques
- Avoir autant de personnages que possible


# Doing
- [ ] Je peux associer une photo à mon personnage

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
