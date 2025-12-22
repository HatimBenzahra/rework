import type { ConnectionDetails, LiveKitRoom } from './monitoring.types'

/**
 * Utilitaires LiveKit pour la gestion des connexions et des rooms
 */
export class LiveKitUtils {
  /**
   * Se connecte comme commercial (publisher)
   */
  static async connectAsCommercial(
    connectionDetails: ConnectionDetails
  ): Promise<LiveKitRoom> {
    try {
      const { Room } = await import('livekit-client')

      const room = new Room()
      await room.connect(
        connectionDetails.serverUrl,
        connectionDetails.participantToken
      )

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
        participants: room.remoteParticipants.size,
        localTracks: room.localParticipant.trackPublications.size,
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
  static async connectAsSupervisor(
    connectionDetails: ConnectionDetails,
    audioContainer: HTMLElement | null = null
  ): Promise<LiveKitRoom> {
    try {
      const { Room } = await import('livekit-client')

      const room = new Room()

      // Écouter les nouveaux tracks audio et les jouer automatiquement
      room.on('trackSubscribed', (track, publication, participant) => {
        console.log(
          '🎧 Track reçu:',
          track.kind,
          'de',
          participant.identity,
          track
        )

        if (track.kind === 'audio') {
          // Créer et attacher l'élément audio
          const audioElement = track.attach() as HTMLAudioElement

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
          audioElement.onerror = (e) => console.error('❌ Erreur audio:', e)
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
            audioElement.play().catch((e) => {
              console.error('❌ Impossible de lancer la lecture automatique:', e)
              console.log('👆 Cliquez sur play manuellement si nécessaire')
            })
          }, 100)

          console.log(
            '🔊 Audio attaché pour:',
            participant.identity,
            audioElement
          )
        }
      })

      // Écouter les déconnexions de tracks
      room.on('trackUnsubscribed', (track, publication, participant) => {
        console.log(
          '🔇 Track détaché:',
          track.kind,
          'de',
          participant.identity
        )
      })

      // Écouter les événements de connexion/déconnexion de participants
      room.on('participantConnected', (participant) => {
        console.log('👤 Participant connecté:', participant.identity)
      })

      room.on('participantDisconnected', (participant) => {
        console.log('👤 Participant déconnecté:', participant.identity)
      })

      await room.connect(
        connectionDetails.serverUrl,
        connectionDetails.participantToken
      )
      console.log('✅ Superviseur connecté:', room.localParticipant.identity)
      console.log(
        '📊 Room participants:',
        room.remoteParticipants.size > 0
          ? Array.from(room.remoteParticipants.keys())
          : 'Aucun participant'
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
  static async disconnect(room: LiveKitRoom): Promise<void> {
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

export default LiveKitUtils
