# Todo
- Un personnage est décorellé à une histoire, 
  - je peux associer jusque 5 personnages à l'histoire
  - Je peux utiliser des personnages crée précédemment
- Mettre un swagger
- Refactoring requis
  - Renommer /status en generation
- Les générations de photos se basent sur la première.
- Automatiser le deploiement avec une cli
- Téléverser une photo afin que l'IA génère des images de personnages proches de ces photos
- Les planches générés doivent se baser sur la première planche généré
- Avoir des personnages ré-utilisables dans mes histoires
- Avoir un compte
- Choisir le nombre de scène dans mon histoire
- Brancher/débrancher facilement les modèles de génération d'histoire (Mock, Ollama, Replicate)
- Spécialiser autour de thème : Fete des mères, fete des pères, Noël, Paques
- Avoir autant de personnages que possible


# Doing
- [ ] Améliorations de je peux associer une photo à mon personnage
  - [Story Generator] Les images sont téléchargés et transformés en bases 64 à chaque génération
    - Elle ne devrait l'être qu'un seule fois
  - Supprimer la demo page des composants
  - l'upload de photo se fait en même temps que les infos des personnages
  - Pas besoin d'endpoint pour supprimer la photo d'un personnage
  - En terme de sécurité, on checke le type de l'image par rapport à ce qu'il y a dans le body
    - L'utilisateur peut nous mentir ... Comment faire mieux ?
      - Verif côté navigateur ? Mais l'utilisateur aura toujours une url pré-signé
      - Configuration du storage pour bloquer certains types et avoir une taille maximum ?
  - Les process.env dans les fichier de libs, c'est pas ouf.
    - Comment faire mieux ?
 

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
