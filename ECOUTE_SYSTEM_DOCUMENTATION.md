# 🎧 Système d'Écoute LiveKit - Documentation Technique

## 📋 Vue d'ensemble

Le système d'écoute permet aux superviseurs (admin/directeur/manager) d'écouter en temps réel les conversations des commerciaux. Il utilise LiveKit Cloud comme infrastructure de streaming audio.

## 🏗️ Architecture Générale

```
Commercial (Frontend) ←→ Backend (NestJS) ←→ LiveKit Cloud ←→ Backend ←→ Superviseur (Frontend)
```

## 🔄 Flow Complet du Système

### 1. 📱 **Commercial se connecte à son interface**

**Fichier** : `/src/pages-COMMERCIAL/layouts/CommercialLayout.jsx`
- Le layout commercial charge automatiquement le hook `useCommercialAutoAudio()`

**Fichier** : `/src/hooks/useCommercialAutoAudio.js`
```javascript
// 1. Vérification du rôle
if (currentRole !== 'commercial' || !currentUserId) return

// 2. Génération automatique du token
const details = await audioMonitoringService.generateCommercialToken(
  parseInt(currentUserId),
  `commercial-${currentUserId}-${Date.now()}`
)
```

### 2. 🔧 **Backend enregistre le commercial comme connecté**

**Fichier** : `/backend/src/audio-monitoring/audio-monitoring.service.ts`
```typescript
async generateCommercialToken(commercialId: number) {
  // 1. Appel à l'API Sandbox LiveKit
  const details = await this.liveKitService.generateConnectionDetails(
    finalRoomName,
    `commercial-${commercialId}`
  )

  // 2. Marquer ce commercial comme connecté
  this.connectedCommercials.set(commercialId, {
    roomName: finalRoomName,
    connectedAt: new Date()
  })

  return details
}
```

**Fichier** : `/backend/src/audio-monitoring/livekit.service.ts`
```typescript
async generateConnectionDetails(roomName: string, participantName: string) {
  const response = await fetch('https://cloud-api.livekit.io/api/sandbox/connection-details', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sandbox-ID': 'ecoute-7pzdpc',
    },
    body: JSON.stringify({
      room_name: roomName,
      participant_name: participantName,
    }),
  })
  
  return response.json() // { serverUrl, participantToken, roomName, participantName }
}
```

### 3. 🎙️ **Commercial active son microphone (automatique)**

**Retour au** : `/src/hooks/useCommercialAutoAudio.js`
```javascript
room.on('connected', async () => {
  // 1. Demander l'accès au microphone
  const stream = await navigator.mediaDevices.getUserMedia({ 
    audio: true, 
    video: false 
  })
  
  // 2. Activer le microphone dans LiveKit
  await room.localParticipant.enableCameraAndMicrophone(false, true)
  
  // 3. Le commercial diffuse maintenant son audio !
})
```

### 4. 👀 **Superviseur voit les commerciaux connectés**

**Fichier** : `/src/pages-ADMIN-DIRECTEUR-MANAGER/ecoutes/EcoutesManagement.jsx`
```javascript
// 1. Récupération périodique des commerciaux connectés
useEffect(() => {
  const fetchActiveRooms = async () => {
    const rooms = await audioMonitoringService.getActiveRooms()
    setActiveRooms(rooms)
  }
  
  fetchActiveRooms()
  setInterval(fetchActiveRooms, 10000) // Toutes les 10 secondes
}, [])

// 2. Affichage du statut
const isCommercialOnline = activeRooms.some(room => 
  room.participantNames.some(name => name.includes(`commercial-${commercial.id}`))
)
```

**Backend retourne** : `/backend/src/audio-monitoring/audio-monitoring.service.ts`
```typescript
async getActiveRooms(): Promise<ActiveRoom[]> {
  const activeRooms: ActiveRoom[] = []
  
  for (const [commercialId, info] of this.connectedCommercials.entries()) {
    activeRooms.push({
      roomName: info.roomName,
      numParticipants: 1,
      createdAt: info.connectedAt,
      participantNames: [`commercial-${commercialId}`],
    })
  }
  
  return activeRooms
}
```

### 5. 🎧 **Superviseur démarre l'écoute**

**Action** : Superviseur clique sur "Écouter" dans l'interface

**Fichier** : `/src/pages-ADMIN-DIRECTEUR-MANAGER/ecoutes/EcoutesManagement.jsx`
```javascript
const handleStartListening = async (commercial) => {
  // 1. Démarrer l'écoute via le backend
  const details = await audioMonitoringService.startMonitoring(
    commercial.id,
    parseInt(currentUserId, 10)
  )
  
  // 2. Afficher l'interface d'écoute
  setConnectionDetails(details)
  setSelectedCommercial(commercial)
}
```

**Backend génère token superviseur** : `/backend/src/audio-monitoring/audio-monitoring.service.ts`
```typescript
async startMonitoring(input: StartMonitoringInput) {
  // 1. Générer token pour le superviseur (listener-only)
  const supervisorConnection = await this.liveKitService.generateConnectionDetails(
    finalRoomName,
    `supervisor-${supervisorId}`
  )
  
  // 2. Créer session de monitoring
  const session: MonitoringSession = {
    id: `session-${Date.now()}`,
    commercialId,
    roomName: finalRoomName,
    status: MonitoringStatus.ACTIVE,
    supervisorId,
  }
  
  return supervisorConnection
}
```

### 6. 🔊 **Écoute en temps réel**

**Fichier** : `/src/components/LiveKitAudioMonitor.jsx`
```javascript
useEffect(() => {
  const roomInstance = new Room()
  
  // 1. Connexion à la room LiveKit
  await roomInstance.connect(serverUrl, token)
  
  // 2. Écoute des tracks audio du commercial
  roomInstance.on('trackSubscribed', (track, publication, participant) => {
    if (track.kind === Track.Kind.Audio) {
      // 3. Attacher l'audio à un élément HTML pour l'écoute
      track.attach(audioElementRef.current)
      setHasAudio(true)
    }
  })
}, [serverUrl, token])
```

## 🔧 Composants Techniques

### Backend (NestJS)

| Fichier | Rôle |
|---------|------|
| `audio-monitoring.module.ts` | Module principal d'écoute |
| `livekit.service.ts` | Interface avec l'API Sandbox LiveKit |
| `audio-monitoring.service.ts` | Logique métier (sessions, tokens) |
| `audio-monitoring.resolver.ts` | Endpoints GraphQL |

### Frontend 

| Fichier | Rôle |
|---------|------|
| `useCommercialAutoAudio.js` | Hook d'écoute automatique commercial |
| `EcoutesManagement.jsx` | Interface superviseur |
| `LiveKitAudioMonitor.jsx` | Composant d'écoute temps réel |
| `audio-monitoring.js` | Service API GraphQL |

## 🌐 Communication LiveKit

### API Sandbox Utilisée
- **URL** : `https://cloud-api.livekit.io/api/sandbox/connection-details`
- **Header** : `X-Sandbox-ID: ecoute-7pzdpc`
- **Méthode** : POST avec `room_name` et `participant_name`

### Tokens JWT Générés
```json
{
  "serverUrl": "wss://prospection-22s07180.livekit.cloud",
  "participantToken": "eyJhbGciOiJIUzI1NiIs...",
  "roomName": "commercial-10-1761052749030",
  "participantName": "commercial-10"
}
```

## 📊 États du Système

### Statuts Commercial (Interface Superviseur)
- 🔴 **"En écoute"** : Superviseur écoute activement ce commercial
- 🟢 **"En ligne"** : Commercial connecté et diffuse audio, mais pas écouté
- ⚫ **"Hors ligne"** : Commercial non connecté

### Sessions de Monitoring
```typescript
interface MonitoringSession {
  id: string
  commercialId: number
  roomName: string
  status: 'ACTIVE' | 'STOPPED' | 'PAUSED'
  startedAt: Date
  supervisorId: number
}
```

## 🔒 Sécurité et Permissions

### Contrôles d'Accès
- ✅ Seuls les **commerciaux** peuvent diffuser audio
- ✅ Seuls les **superviseurs** (admin/directeur/manager) peuvent écouter
- ✅ Tokens JWT LiveKit avec expiration 15 minutes
- ✅ Sandbox protégé par `X-Sandbox-ID`

### Permissions LiveKit
- **Commercial** : `canPublish: true` (peut diffuser audio)
- **Superviseur** : `canPublish: false` (écoute uniquement)

## 🔄 Cycle de Vie Complet

```
1. Commercial charge son interface
   ↓
2. Hook useCommercialAutoAudio() se déclenche
   ↓  
3. Appel generateCommercialToken() → Backend enregistre comme connecté
   ↓
4. Connexion LiveKit + activation microphone automatique
   ↓
5. Superviseur voit commercial "En ligne" (polling 10s)
   ↓
6. Superviseur clique "Écouter" → startMonitoring()
   ↓
7. Token superviseur généré → Connexion LiveKit
   ↓
8. Stream audio temps réel : Commercial → LiveKit → Superviseur
```

## 🚀 Points Clés

- **Automatique** : Aucune action requise du commercial
- **Temps réel** : Audio streaming direct via WebRTC
- **Scalable** : Chaque commercial a sa propre room
- **Sécurisé** : Tokens temporaires + sandbox isolé
- **Monitoring** : Sessions trackées côté backend

## 🛠️ Debugging

### Logs Commercial
```
🔍 useCommercialAutoAudio - Role: commercial UserID: 10
🎤 Démarrage écoute automatique pour commercial: 10  
📡 Commercial enregistré comme connecté: commercial-10-xxx
✅ Commercial connecté à la room audio: commercial-10-xxx
🎙️ Accès microphone obtenu
✅ Microphone activé dans LiveKit
```

### Logs Superviseur  
```
Connexion à la room: commercial-10-xxx
👥 Commercial connecté: commercial-10
🎵 Audio reçu de: commercial-10
🔊 Audio attaché à l'élément HTML
```

## 🎯 Résultat Final

Le superviseur entend en temps réel l'audio du microphone du commercial, permettant une supervision discrète et efficace des interactions client. 🎧