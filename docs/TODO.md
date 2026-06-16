# Todo
- Automatiser le deploiement avec une cli

# Doing
- [ ] Déployer sur Vercel et Supabase
  - [X] L'application doit lancer les migrations au moment du lancement
  - [X] Créer application sur Vercel
  - [X] Renseigner les variables d'environnements
  - [X] Faire un deploiement
  - [ ] Problème en prod
    - [ ] La construction de l'url public de l'image est différente entre minio et supabase
      - Minio c'est comme actuellement
      - Pour supabase
      - Il ne faut pas enregistrer l'url dans la bdd, mais plutôt le bucket, la clé
      - Il faut renseigner une variable d'env 
        - Supabase : STORAGE_BASE_URL = "https://zwuapejxeikbtnrumwtt.supabase.co/storage/v1/object/public";
        - Minio : STORAGE_BASE_URL = "à déterminer";
      - STORAGE_URL_PUBLIC_IMAGES
        - Minio :  
        - Supabase
      - 
        - 
          return `${protocol}://${this.config.endpoint}${port}/${this.config.bucket}/${key}`;
  - [ ] Automatiser avec une seule commande le deploiement
    // "deploy": "npm run db:migrate && cmd vercel", avec variable d'env de la prod
