# Guide Complet de Tests curl pour l'API Arcane

## Configuration de Base

```bash
# Variables d'environnement
export API_URL="http://localhost:5000"
export TOKEN=""  # Sera défini après login
```

## 1. Authentification

### 1.1 Inscription
```bash
curl -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "<DEMO_PASSWORD>",
    "firstName": "John",
    "lastName": "Doe",
    "role": "SCOUT"
  }'
```

### 1.2 Connexion
```bash
# Login et sauvegarder le token
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "scout1@arcane.com",
    "password": "<DEMO_PASSWORD>"
  }' | jq -r '.token'

# Ou directement sauvegarder dans une variable
export TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "scout1@arcane.com", "password": "<DEMO_PASSWORD>"}' | jq -r '.token')
```

### 1.3 Obtenir les infos de l'utilisateur connecté
```bash
curl -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

### 1.4 Refresh Token
```bash
curl -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

### 1.5 Déconnexion
```bash
curl -X POST "$API_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

## 2. Players (Joueurs)

### 2.1 Lister les joueurs
```bash
# Sans authentification
curl -X GET "$API_URL/players"

# Avec filtres
curl -X GET "$API_URL/players?age=20-25&height=170-185&page=1&limit=10"

# Avec pagination
curl -X GET "$API_URL/players?page=2&limit=20"
```

### 2.2 Obtenir un joueur spécifique
```bash
curl -X GET "$API_URL/players/player-id-here"
```

### 2.3 Créer un joueur (nécessite auth + rôle)
```bash
curl -X POST "$API_URL/players" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Kylian",
    "lastName": "Mbappé",
    "birthDate": "1998-12-20",
    "nationality": "French",
    "position": "STRIKER",
    "height": 178,
    "weight": 73,
    "preferredFoot": "RIGHT",
    "currentClubId": "club-id-here"
  }'
```

### 2.4 Mettre à jour un joueur
```bash
curl -X PUT "$API_URL/players/player-id-here" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "height": 180,
    "weight": 75,
    "marketValue": 180000000
  }'
```

### 2.5 Supprimer un joueur (Admin only)
```bash
curl -X DELETE "$API_URL/players/player-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

### 2.6 Obtenir les stats d'un joueur
```bash
curl -X GET "$API_URL/players/player-id-here/stats"
```

### 2.7 Obtenir les rapports d'un joueur
```bash
curl -X GET "$API_URL/players/player-id-here/reports"
```

## 3. Clubs

### 3.1 Lister les clubs
```bash
# Sans filtres
curl -X GET "$API_URL/clubs"

# Avec filtres
curl -X GET "$API_URL/clubs?country=France&city=Paris&search=PSG"
```

### 3.2 Créer un club
```bash
curl -X POST "$API_URL/clubs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paris Saint-Germain",
    "country": "France",
    "city": "Paris",
    "founded": 1970,
    "stadium": "Parc des Princes",
    "capacity": 47929,
    "website": "https://www.psg.fr",
    "colors": ["Blue", "Red", "White"]
  }'
```

### 3.3 Obtenir les joueurs d'un club
```bash
curl -X GET "$API_URL/clubs/club-id-here/players"
```

### 3.4 Obtenir les matchs d'un club
```bash
curl -X GET "$API_URL/clubs/club-id-here/matches?upcoming=true"
```

## 4. Matches

### 4.1 Créer un match
```bash
curl -X POST "$API_URL/matches" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "homeTeamId": "club-id-1",
    "awayTeamId": "club-id-2",
    "date": "2024-12-15T20:00:00Z",
    "competition": "Ligue 1",
    "season": "2024-2025",
    "stadium": "Parc des Princes",
    "status": "SCHEDULED"
  }'
```

### 4.2 Lister les matchs
```bash
# Tous les matchs
curl -X GET "$API_URL/matches"

# Matchs à venir
curl -X GET "$API_URL/matches/upcoming?limit=5"

# Matchs en direct
curl -X GET "$API_URL/matches/live"

# Avec filtres
curl -X GET "$API_URL/matches?status=COMPLETED&competition=Ligue%201&season=2024-2025"
```

### 4.3 Mettre à jour le score d'un match
```bash
curl -X PATCH "$API_URL/matches/match-id-here/score" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "homeScore": 2,
    "awayScore": 1
  }'
```

### 4.4 Assigner un scout à un match
```bash
curl -X PATCH "$API_URL/matches/match-id-here/assign-scout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scoutId": "scout-user-id"
  }'
```

## 5. Scouting Reports

### 5.1 Créer un rapport de scouting
```bash
curl -X POST "$API_URL/scouting-reports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player-id",
    "matchId": "match-id",
    "overallRating": 8.5,
    "technicalSkills": {
      "ballControl": 9,
      "passing": 8,
      "shooting": 7,
      "dribbling": 9
    },
    "physicalAttributes": {
      "pace": 9,
      "strength": 7,
      "stamina": 8,
      "jumping": 7
    },
    "mentalAttributes": {
      "decisionMaking": 8,
      "positioning": 8,
      "vision": 9,
      "workRate": 9
    },
    "summary": "Excellente performance avec beaucoup de créativité",
    "strengths": ["Vitesse", "Technique", "Vision du jeu"],
    "weaknesses": ["Jeu aérien", "Pied faible"],
    "recommendation": "HIGHLY_RECOMMENDED"
  }'
```

### 5.2 Obtenir les rapports
```bash
# Tous les rapports (avec auth)
curl -X GET "$API_URL/scouting-reports" \
  -H "Authorization: Bearer $TOKEN"

# Rapports d'un joueur
curl -X GET "$API_URL/scouting-reports/player/player-id-here" \
  -H "Authorization: Bearer $TOKEN"

# Rapports d'un scout
curl -X GET "$API_URL/scouting-reports/scout/scout-id-here" \
  -H "Authorization: Bearer $TOKEN"

# Rapports d'un match
curl -X GET "$API_URL/scouting-reports/match/match-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

### 5.3 Soumettre un rapport
```bash
curl -X POST "$API_URL/scouting-reports/report-id-here/submit" \
  -H "Authorization: Bearer $TOKEN"
```

### 5.4 Réviser un rapport
```bash
curl -X POST "$API_URL/scouting-reports/report-id-here/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true
  }'
```

## 6. Subscriptions (Abonnements)

### 6.1 Voir les prix
```bash
curl -X GET "$API_URL/subscriptions/pricing"
```

### 6.2 Obtenir son abonnement
```bash
curl -X GET "$API_URL/subscriptions/me" \
  -H "Authorization: Bearer $TOKEN"
```

### 6.3 Créer/Mettre à jour un abonnement
```bash
curl -X POST "$API_URL/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "GOLD",
    "period": "MONTHLY"
  }'
```

### 6.4 Annuler un abonnement
```bash
curl -X PUT "$API_URL/subscriptions/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Too expensive",
    "feedback": "Would reconsider at lower price"
  }'
```

## 7. Analytics

### 7.1 Vue d'ensemble de la plateforme
```bash
curl -X GET "$API_URL/analytics/overview" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.2 Analytics des joueurs
```bash
curl -X GET "$API_URL/analytics/players" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.3 Tendances d'activité
```bash
curl -X GET "$API_URL/analytics/activity-trends?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.4 Métriques RBAC
```bash
curl -X GET "$API_URL/analytics/rbac-metrics?days=7" \
  -H "Authorization: Bearer $TOKEN"
```

## 8. Search (Recherche)

### 8.1 Recherche globale
```bash
curl -X GET "$API_URL/search?query=Mbappe&type=player&limit=10"
```

### 8.2 Recherche rapide
```bash
curl -X GET "$API_URL/search/quick?query=PSG&limit=5"
```

## 9. AI Features (Fonctionnalités IA - Gold Tier)

### 9.1 Générer un résumé AI
```bash
curl -X POST "$API_URL/ai/summary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player-id",
    "context": "performance_analysis",
    "language": "fr"
  }'
```

### 9.2 Obtenir l'index Arcane d'un joueur
```bash
curl -X GET "$API_URL/ai/index/player-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

### 9.3 Matchmaking IA
```bash
curl -X POST "$API_URL/ai/matchmaking" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clubId": "club-id",
    "position": "STRIKER",
    "budget": 50000000,
    "preferences": {
      "ageRange": [18, 25],
      "nationality": ["French", "Brazilian"],
      "minRating": 7.5
    }
  }'
```

### 9.4 Prédiction de talent
```bash
curl -X GET "$API_URL/ai/talent-prediction/player-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

## 10. Auto Scout (Génération automatique de rapports)

### 10.1 Générer un rapport automatique
```bash
curl -X POST "$API_URL/auto-scout/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player-id",
    "matchId": "match-id",
    "template": "comprehensive",
    "language": "fr"
  }'
```

### 10.2 Preview d'un rapport
```bash
curl -X GET "$API_URL/auto-scout/preview/player-id?matchId=match-id" \
  -H "Authorization: Bearer $TOKEN"
```

### 10.3 Obtenir les templates disponibles
```bash
curl -X GET "$API_URL/auto-scout/templates" \
  -H "Authorization: Bearer $TOKEN"
```

## 11. Voice to Report (Transcription vocale)

### 11.1 Traiter un rapport vocal
```bash
# Avec un fichier audio
curl -X POST "$API_URL/voice-to-report/process" \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@/path/to/audio/file.mp3" \
  -F "language=fr" \
  -F "matchId=match-id" \
  -F "playerId=player-id" \
  -F "keepAudio=false"
```

### 11.2 Obtenir les langues supportées
```bash
curl -X GET "$API_URL/voice-to-report/languages" \
  -H "Authorization: Bearer $TOKEN"
```

## 12. Market Value (Valeur marchande)

### 12.1 Obtenir la valeur d'un joueur
```bash
curl -X GET "$API_URL/market-value/player/player-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

### 12.2 Tendance de valeur
```bash
curl -X GET "$API_URL/market-value/trend/player-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

### 12.3 Comparer des joueurs
```bash
curl -X POST "$API_URL/market-value/compare" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playerIds": ["player-id-1", "player-id-2", "player-id-3"]
  }'
```

## 13. Playstyle DNA

### 13.1 Obtenir le profil DNA d'un joueur
```bash
curl -X GET "$API_URL/playstyle-dna/profile/player-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

### 13.2 Trouver des joueurs similaires
```bash
curl -X GET "$API_URL/playstyle-dna/similar/player-id?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 13.3 Données radar
```bash
curl -X GET "$API_URL/playstyle-dna/radar/player-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

## 14. Health Check

### 14.1 Vérifier la santé de l'API
```bash
curl -X GET "$API_URL/health"
```

### 14.2 Vérifier la préparation
```bash
curl -X GET "$API_URL/health/ready"
```

### 14.3 Vérifier si le service est vivant
```bash
curl -X GET "$API_URL/health/live"
```

## 15. Notifications

### 15.1 Enregistrer un appareil pour les notifications
```bash
curl -X POST "$API_URL/notifications/register-device" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "firebase-cloud-messaging-token",
    "platform": "ios"
  }'
```

### 15.2 Envoyer une notification
```bash
curl -X POST "$API_URL/notifications/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "title": "Nouveau rapport disponible",
    "body": "Un nouveau rapport de scouting a été créé",
    "type": "REPORT_CREATED",
    "data": {
      "reportId": "report-id"
    }
  }'
```

## 16. Upload de fichiers (Media)

### 16.1 Upload d'un avatar de joueur
```bash
curl -X POST "$API_URL/media/upload/player/player-id/avatar" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### 16.2 Upload d'un logo de club
```bash
curl -X POST "$API_URL/media/upload/club/club-id/logo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/logo.png"
```

### 16.3 Télécharger un fichier
```bash
curl -X GET "$API_URL/media/media-id/download" \
  -H "Authorization: Bearer $TOKEN" \
  --output downloaded-file.jpg
```

## Tips et Bonnes Pratiques

### Gestion des erreurs
```bash
# Capturer et afficher les erreurs
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "wrong@email.com", "password": "wrong"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v 2>&1 | grep -E "< HTTP|{.*}"
```

### Formater la sortie avec jq
```bash
# Pretty print JSON
curl -s -X GET "$API_URL/players" | jq '.'

# Extraire des champs spécifiques
curl -s -X GET "$API_URL/players" | jq '.data[] | {id, firstName, lastName}'

# Compter les résultats
curl -s -X GET "$API_URL/players" | jq '.data | length'
```

### Variables de session
```bash
# Créer un fichier de session
cat > session.sh << 'EOF'
#!/bin/bash
export API_URL="http://localhost:5000"
export EMAIL="scout1@arcane.com"
export PASSWORD="<DEMO_PASSWORD>"
export TOKEN=""

login() {
  export TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" | jq -r '.token')
  echo "Token saved: ${TOKEN:0:20}..."
}

auth_get() {
  curl -s -X GET "$API_URL/$1" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
}

auth_post() {
  curl -s -X POST "$API_URL/$1" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$2" | jq '.'
}
EOF

# Utiliser la session
source session.sh
login
auth_get "players"
auth_post "players" '{"firstName": "Test", "lastName": "Player"}'
```

### Tests de performance
```bash
# Mesurer le temps de réponse
time curl -s -X GET "$API_URL/players" > /dev/null

# Test de charge avec parallel requests
for i in {1..10}; do
  curl -s -X GET "$API_URL/players" > /dev/null &
done
wait

# Avec Apache Bench (ab)
ab -n 100 -c 10 "$API_URL/players"
```

### Debug mode
```bash
# Voir tous les headers
curl -X GET "$API_URL/players" -v

# Suivre les redirections
curl -L -X GET "$API_URL/players"

# Timeout après 5 secondes
curl --connect-timeout 5 -X GET "$API_URL/players"

# Retry en cas d'échec
curl --retry 3 --retry-delay 2 -X GET "$API_URL/players"
```