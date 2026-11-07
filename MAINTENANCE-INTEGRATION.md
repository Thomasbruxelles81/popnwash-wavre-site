# POP’n WASH – intégration Maintenance (préparation)

Cette branche prépare uniquement la petite roue d'accès à l'application privée. L'URL ciblée est `https://maintenance.popnwash.be/` ; **elle n'est pas encore configurée**. Ne pas fusionner avant la mise en service complète.

## Prérequis pour publier le lien

1. Déployer l'application de maintenance avec un serveur et une base de données privée. GitHub Pages ne permet pas, seul, de gérer la connexion sécurisée ou les données privées.
2. Remplacer dans l'application les appels Google Apps Script `google.script.run` par une API serveur authentifiée. Aucune donnée client, identifiant, clé privée ni mot de passe dans le dépôt public.
3. Ajouter la connexion par adresse e-mail autorisée et mot de passe individuel, avec récupération, protection contre les tentatives répétées et sessions sécurisées.
4. Vérifier une sauvegarde complète du carnet actuel puis migrer et contrôler les équipements, les pannes, les pièces, les factures, les photos et l'historique sans perte.
5. Configurer le sous-domaine chez OVH pour l'hébergement de l'application, puis HTTPS.
6. Tester l'authentification, les rôles, les sauvegardes et la synchronisation multi-appareils.
7. Mettre en place le manifeste PWA et les icônes, puis vérifier l'installation sur iOS/Android/ordinateur et les navigateurs Safari, Chrome, Edge et Firefox.
8. Après validation des points précédents, fusionner cette PR pour rendre la roue visible sur le site public.

Le raccourci discret ne protège pas les données : c'est au serveur de refuser toutes les requêtes non autorisées.
