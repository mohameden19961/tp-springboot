# TP Spring Boot - Système de Gestion des Étudiants et Cours

Ce projet est une API REST sécurisée développée avec Spring Boot pour la gestion des étudiants, des cours et des inscriptions. Il intègre une authentification OAuth2 (Google) et une gestion d'autorisation fine basée sur les rôles et la propriété des données.

## 🚀 Fonctionnalités

### 🔐 Sécurité & Authentification
- **Authentification OAuth2 (Google)** : Connexion sécurisée via un compte Google.
- **Tokens JWT** : Génération de tokens d'accès et de rafraîchissement stockés en base de données pour permettre la révocation.
- **Gestion des Rôles** :
  - **ADMIN** (`24068@supnum.mr`) : Accès complet (Lecture, Création, Modification, Suppression) sur toutes les données.
  - **USER** : Accès restreint à ses propres créations.

### 🛡️ Contrôle d'Accès (Autorisation)
- **Propriété des données** : Un utilisateur standard ne peut voir, modifier ou inscrire que les étudiants et cours qu'il a lui-même créés.
- **Filtrage automatique** : Les listes (`/students`, `/courses`) sont automatiquement filtrées selon l'utilisateur connecté.
- **Interdiction de suppression** : Seul l'administrateur peut supprimer des enregistrements.

### 📊 Gestion des Données
- CRUD complet pour les Étudiants et les Cours.
- Système d'inscription d'un étudiant à un cours.
- Recherche (`/search`) et Pagination (`/page`).

## 🛠️ Technologies
- **Java 17**
- **Spring Boot 3**
- **Spring Security** (OAuth2 Client, JWT)
- **Spring Data JPA**
- **MySQL** / **H2**
- **JSON Web Token (jjwt)**

## ⚙️ Configuration

1. **Base de données** : Configurez votre connexion MySQL dans `src/main/resources/application.properties`.
2. **Google OAuth2** :
   - Créez un projet sur la console Google Cloud.
   - Configurez les identifiants OAuth2.
   - Ajoutez le `client-id` et le `client-secret` dans le fichier `application.properties`.
3. **JWT** : Modifiez la clé secrète `jwt.secret` (minimum 32 caractères).

## 📄 API Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/login` | Page de connexion Google |
| GET | `/api/auth/token` | Affiche le token JWT après login |
| GET | `/students` | Liste des étudiants (filtrée ou totale pour admin) |
| POST | `/students` | Créer un nouvel étudiant |
| POST | `/students/{sId}/courses/{cId}` | Inscrire un étudiant à un cours |
| DELETE | `/students/{id}` | Supprimer un étudiant (Admin uniquement) |
| GET | `/courses` | Liste des cours (filtrée ou totale pour admin) |

## 📦 Installation & Lancement

```bash
# Cloner le dépôt
git clone https://github.com/mohameden19961/tp-springboot.git

# Lancer l'application
./mvnw spring-boot:run
```

---
*Projet réalisé dans le cadre du TP Spring Boot - SUP'NUM*
