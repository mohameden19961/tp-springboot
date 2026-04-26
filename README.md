# 🎓 Système de Gestion des Étudiants (Spring Boot API)

Une plateforme API REST robuste et sécurisée pour la gestion des étudiants et des cours, conçue avec une architecture en couches et une sécurité de pointe.

---

## 🌟 Points Forts du Projet

- **Architecture Standard** : Structure en couches (Controller, Service, Repository, Model, DTO).
- **Sécurité Hybride** : Authentification OAuth2 (Google) couplée à une distribution de tokens JWT.
- **Contrôle d'Accès Fin (RBAC & ABAC)** :
  - **RBAC** : Rôles distincts pour l'Admin et les Utilisateurs.
  - **ABAC** : Propriété des données (un utilisateur ne voit et ne modifie que ce qu'il a créé).
- **Tokens Révoquables** : Gestion des Refresh Tokens stockés en base de données pour une sécurité accrue.

---

## 📂 Structure du Projet

L'organisation des fichiers suit les conventions professionnelles de Spring Boot :

```
src/main/java/com/supnum/tp/
├── controller/      # Points d'entrée de l'API (HTTP handling)
├── service/         # Logique métier et sécurité applicative
├── repository/      # Couche d'accès aux données (JPA)
├── model/           # Entités de base de données
├── dto/             # Objets de transfert de données (Data Transfer Objects)
├── security/        # Configuration OAuth2, JWT et Filtres
├── exception/       # Gestionnaire d'erreurs global
└── TpApplication.java # Point d'entrée principal
```

---

## 🔐 Architecture de Sécurité

### 1. Flux d'Authentification
1. L'utilisateur accède à `/login` -> Redirection vers Google via **OAuth2**.
2. Après succès, l'application génère un **Access Token** et un **Refresh Token**.
3. Les tokens sont affichés via `/api/auth/token` et l'Access Token est stocké dans un cookie `HttpOnly`.

### 2. Permissions par Rôle
| Rôle | Utilisateur (Email) | Permissions |
|:--- |:--- |:--- |
| **ADMIN** | `24068@supnum.mr` | Accès complet à tous les étudiants et cours du système. |
| **USER** | Tout autre email | Accès limité à ses propres créations. Suppression interdite. |

---

## 🛠️ Configuration & Installation

### Pré-requis
- Java 21+
- Maven
- MySQL (ou configuration H2 alternative)

### 1. Configuration de la base de données
Modifiez `src/main/resources/application.properties` :
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/tp_spring
spring.datasource.username=VOTRE_USER
spring.datasource.password=VOTRE_MOT_DE_PASSE
```

### 2. Configuration Google Auth
Obtenez vos identifiants sur [Google Cloud Console](https://console.cloud.google.com/) et complétez :
```properties
spring.security.oauth2.client.registration.google.client-id=VOTRE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=VOTRE_SECRET
```

### 3. Lancement
```bash
mvn clean install
mvn spring-boot:run
```

---

## 📄 Documentation de l'API

### Authentification
- `GET /login` : Démarre le flux Google OAuth2.
- `GET /api/auth/token` : Récupère les tokens après authentification.
- `POST /api/auth/refresh?refresh_token=...` : Renouvelle l'Access Token.

### Gestion des Étudiants
- `GET /students` : Liste les étudiants (filtrée par propriétaire).
- `GET /students/{id}` : Détails d'un étudiant.
- `POST /students` : Créer un étudiant.
- `PUT /students/{id}` : Modifier un étudiant.
- `DELETE /students/{id}` : Supprimer (ADMIN uniquement).
- `GET /students/search?name=...` : Recherche par nom.
- `GET /students/page?page=0&size=5` : Liste paginée.

### Gestion des Cours & Inscriptions
- `GET /courses` : Liste des cours.
- `POST /courses` : Créer un cours.
- `POST /students/{sId}/courses/{cId}` : Inscrire un étudiant à un cours.
- `GET /courses/{id}/students` : Liste les étudiants inscrits à un cours.

---

## 🚀 Utilisation avec Postman
Pour tester l'API via Postman après authentification Google :
1. Copiez l'Access Token depuis `/api/auth/token`.
2. Dans Postman, allez dans l'onglet **Authorization**.
3. Sélectionnez **Bearer Token** et collez votre token.

---
*Réalisé pour le TP Spring Boot - SUP'NUM*
