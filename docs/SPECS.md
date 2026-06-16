# Spécifications fonctionnelles

## WHY 
Ce logiciel a pour but de créer des livres d'histoires personnalisés.

## HOW
Afin de produire ces histoires, le logiciel utilise l'intelligence artificielle

Voici le flow utilisateurs afin de créer une histoire aujourd'hui : 
1) L'utilisateur renseigne le nom de son histoire et fournit une description
2) L'utilisateur ajoute un personnage avec un nom et une description
3) L'utilisateur ajoute un deuxième personnage avec un nom et une description
4) L'utilisateur clique sur générer une histoire
5) L'IA génère l'histoire
   - Un modèle de génération de texte génère un scenario en 4 parties
   - Un modèle de génération d'images génère des images basés sur ces personnages et les scenarios générés
6) Les images générés s'affiches dans l'application

## Idées futures
- Téléverser une photo afin que l'IA génère des images de personnages proches de ces photos
- Les planches générés doivent se baser sur la première planche généré
- Avoir des personnages ré-utilisables dans mes histoires
- Avoir un compte
- Choisir le nombre de scène dans mon histoire
- Brancher/débrancher facilement les modèles de génération d'histoire (Mock, Ollama, Replicate)
- Spécialiser autour de thème : Fete des mères, fete des pères, Noël, Paques
- Avoir autant de personnages que possible
