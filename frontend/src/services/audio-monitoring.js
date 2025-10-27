import { graphqlClient } from './graphql-client'

// GraphQL Mutations et Queries
const GENERATE_COMMERCIAL_TOKEN = `
  mutation GenerateCommercialToken($commercialId: Int!, $roomName: String) {
    generateCommercialToken(commercialId: $commercialId, roomName: $roomName) {
      serverUrl
      participantToken
      roomName
      participantName
    }
  }
`

const GENERATE_MANAGER_TOKEN = `
  mutation GenerateManagerToken($managerId: Int!, $roomName: String) {
    generateManagerToken(managerId: $managerId, roomName: $roomName) {
      serverUrl
      participantToken
      roomName
      participantName
    }
  }
`

const START_MONITORING = `
  mutation StartMonitoring($input: StartMonitoringInput!) {
    startMonitoring(input: $input) {
      serverUrl
      participantToken
      roomName
      participantName
    }
  }
`

const STOP_MONITORING = `
  mutation StopMonitoring($input: StopMonitoringInput!) {
    stopMonitoring(input: $input)
  }
`

const GET_ACTIVE_SESSIONS = `
  query GetActiveSessions {
    getActiveSessions {
      id
      commercialId
      roomName
      status
      startedAt
      supervisorId
    }
  }
`

const GET_ACTIVE_ROOMS = `
  query GetActiveRooms {
    getActiveRooms {
      roomName
      numParticipants
      createdAt
      participantNames
    }
  }
`

// Service pour l'audio monitoring
export class AudioMonitoringService {
  /**
   * Génère un token commercial pour publisher
   */
  static async generateCommercialToken(commercialId, roomName = null) {
    try {
      const data = await graphqlClient.request(GENERATE_COMMERCIAL_TOKEN, {
        commercialId,
        roomName,
      })
      return data.generateCommercialToken
    } catch (error) {
      console.error('Erreur génération token commercial:', error)
      throw error
    }
  }

  /**
   * Génère un token manager pour publisher
   */
  static async generateManagerToken(managerId, roomName = null) {
    try {
      const data = await graphqlClient.request(GENERATE_MANAGER_TOKEN, {
        managerId,
        roomName,
      })
      return data.generateManagerToken
    } catch (error) {
      console.error('Erreur génération token manager:', error)
      throw error
    }
  }

  /**
   * Génère un token universel (commercial ou manager)
   */
  static async generateUserToken(userId, userType, roomName = null) {
    if (userType === 'manager') {
      return this.generateManagerToken(userId, roomName)
    } else {
      return this.generateCommercialToken(userId, roomName)
    }
  }

  /**
   * Démarre une session de monitoring (superviseur)
   */
  static async startMonitoring(commercialId, supervisorId, roomName = null) {
    try {
      const data = await graphqlClient.request(START_MONITORING, {
        input: { commercialId, supervisorId, roomName },
      })
      return data.startMonitoring
    } catch (error) {
      console.error('Erreur démarrage monitoring:', error)
      throw error
    }
  }

  /**
   * Arrête une session de monitoring
   */
  static async stopMonitoring(sessionId) {
    try {
      const data = await graphqlClient.request(STOP_MONITORING, {
        input: { sessionId },
      })
      return data.stopMonitoring
    } catch (error) {
      // Si la session n'existe plus, ce n'est pas une vraie erreur
      if (error.message?.includes('not found')) {
        console.log('ℹ️ Session de monitoring déjà fermée:', sessionId)
        return true
      }
      console.error('Erreur arrêt monitoring:', error)
      throw error
    }
  }

  /**
   * Récupère les sessions actives
   */
  static async getActiveSessions() {
    try {
      const data = await graphqlClient.request(GET_ACTIVE_SESSIONS)
      return data.getActiveSessions
    } catch (error) {
      console.error('Erreur récupération sessions actives:', error)
      throw error
    }
  }

  /**
   * Récupère les rooms actives avec participants
   */
  static async getActiveRooms() {
    try {
      const data = await graphqlClient.request(GET_ACTIVE_ROOMS)
      return data.getActiveRooms
    } catch (error) {
      console.error('Erreur récupération rooms actives:', error)
      throw error
    }
  }
}

// Utilitaires LiveKit
export class LiveKitUtils {
  /**
   * Se connecte comme commercial (publisher)
   */
  static async connectAsCommercial(connectionDetails) {
    try {
      // Import dynamique de LiveKit (CDN)
      const { Room } = await import('https://cdn.skypack.dev/livekit-client@2')

      const room = new Room()
      await room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)

      // Publier automatiquement l'audio
      console.log('🎤 Demande accès microphone...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      const audioTrack = stream.getTracks()[0]
      console.log('🎤 Track audio obtenu:', audioTrack)

      await room.localParticipant.publishTrack(audioTrack)
      console.log('📡 Track audio publié')

      console.log('✅ Commercial connecté:', room.localParticipant.identity)
      console.log('📊 Room state:', {
        participants: room.participants ? room.participants.size : 0,
        localTracks: room.localParticipant.tracks ? room.localParticipant.tracks.size : 0,
      })

      return room
    } catch (error) {
      console.error('Erreur connexion commercial:', error)
      throw error
    }
  }

  /**
   * Se connecte comme superviseur (subscriber)
   */
  static async connectAsSupervisor(connectionDetails, audioContainer = null) {
    try {
      const { Room } = await import('https://cdn.skypack.dev/livekit-client@2')

      const room = new Room()

      // Écouter les nouveaux tracks audio et les jouer automatiquement
      room.on('trackSubscribed', (track, publication, participant) => {
        console.log('🎧 Track reçu:', track.kind, 'de', participant.identity, track)

        if (track.kind === 'audio') {
          // Créer et attacher l'élément audio
          const audioElement = track.attach()

          // Configuration audio pour maximiser les chances de lecture
          audioElement.autoplay = true
          audioElement.controls = false // Pas de contrôles natifs visibles
          audioElement.volume = 1.0
          audioElement.muted = false

          // Style pour cacher l'élément tout en gardant la fonctionnalité
          audioElement.style.display = 'none'

          // Events pour debug
          audioElement.onplay = () => console.log('▶️ Audio démarré')
          audioElement.onpause = () => console.log('⏸️ Audio mis en pause')
          audioElement.onerror = e => console.error('❌ Erreur audio:', e)
          audioElement.onloadstart = () => console.log('🔄 Chargement audio...')
          audioElement.oncanplay = () => console.log('✅ Audio prêt à jouer')

          // Ajouter au DOM
          if (audioContainer) {
            audioContainer.appendChild(audioElement)
          } else {
            document.body.appendChild(audioElement)
          }

          // Forcer la lecture après un court délai
          setTimeout(() => {
            audioElement.play().catch(e => {
              console.error('❌ Impossible de lancer la lecture automatique:', e)
              console.log('👆 Cliquez sur play manuellement si nécessaire')
            })
          }, 100)

          console.log('🔊 Audio attaché pour:', participant.identity, audioElement)
        }
      })

      // Écouter les déconnexions de tracks
      room.on('trackUnsubscribed', (track, publication, participant) => {
        console.log('🔇 Track détaché:', track.kind, 'de', participant.identity)
      })

      // Écouter les événements de connexion/déconnexion de participants
      room.on('participantConnected', participant => {
        console.log('👤 Participant connecté:', participant.identity)
      })

      room.on('participantDisconnected', participant => {
        console.log('👤 Participant déconnecté:', participant.identity)
      })

      await room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
      console.log('✅ Superviseur connecté:', room.localParticipant.identity)
      console.log(
        '📊 Room participants:',
        room.participants ? Array.from(room.participants.keys()) : 'Aucun participant'
      )

      return room
    } catch (error) {
      console.error('Erreur connexion superviseur:', error)
      throw error
    }
  }

  /**
   * Déconnecte proprement une room
   */
  static async disconnect(room) {
    try {
      if (room) {
        await room.disconnect()
        console.log('🔌 Déconnexion LiveKit')
      }
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }
}

export default AudioMonitoringService
