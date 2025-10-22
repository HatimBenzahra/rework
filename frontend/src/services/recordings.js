import { graphqlClient } from './graphql-client'

// GraphQL Queries pour les enregistrements
const LIST_RECORDINGS = `
  query ListRecordings($roomName: String!) {
    listRecordings(roomName: $roomName) {
      key
      size
      lastModified
      url
    }
  }
`

const START_RECORDING = `
  mutation StartRecording($input: StartRecordingInput!) {
    startRecording(input: $input) {
      egressId
      roomName
      status
      s3Key
      url
    }
  }
`

const STOP_RECORDING = `
  mutation StopRecording($input: StopRecordingInput!) {
    stopRecording(input: $input)
  }
`

const GET_STREAMING_URL = `
  query GetStreamingUrl($key: String!) {
    getStreamingUrl(key: $key)
  }
`

// Service pour la gestion des enregistrements
export class RecordingService {
  /**
   * Récupère la liste des enregistrements pour un commercial
   * @param {number} commercialId - ID du commercial
   * @returns {Promise<Array>} Liste des enregistrements filtrés (uniquement .mp4)
   */
  static async getRecordingsForCommercial(commercialId) {
    try {
      // Le roomName suit le pattern room_commercial_{id} basé sur la structure S3 réelle
      const roomName = `room_commercial_${commercialId}`
      console.log('🔍 Recherche enregistrements pour roomName:', roomName)

      const data = await graphqlClient.request(LIST_RECORDINGS, {
        roomName,
      })

      console.log('📦 Données reçues de S3:', data)
      console.log('📋 Liste brute:', data.listRecordings)

      // Filtrer uniquement les fichiers .mp4
      const recordings = data.listRecordings.filter(
        recording => recording.key && recording.key.toLowerCase().endsWith('.mp4')
      )

      console.log('🎬 Fichiers .mp4 filtrés:', recordings)

      // Enrichir les données pour l'affichage (sans charger les URLs immédiatement)
      const enrichedRecordings = recordings.map(recording => ({
        id: recording.key,
        key: recording.key,
        url: null, // On charge l'URL seulement quand on clique sur "Écouter"
        rawUrl: recording.url, // Garde l'URL originale pour lazy loading
        size: recording.size,
        lastModified: recording.lastModified,
        // Extraire des infos du nom de fichier si possible
        filename: recording.key.split('/').pop(),
        date: recording.lastModified ? new Date(recording.lastModified).toLocaleDateString() : '',
        time: recording.lastModified ? new Date(recording.lastModified).toLocaleTimeString() : '',
        duration: this.formatFileSize(recording.size), // On affiche la taille en attendant la vraie durée
        commercialId,
      }))

      console.log('✨ Enregistrements enrichis:', enrichedRecordings)
      return enrichedRecordings
    } catch (error) {
      console.error('❌ Erreur récupération enregistrements:', error)
      throw error
    }
  }

  /**
   * Démarre un enregistrement pour un commercial
   */
  static async startRecording(commercialId, audioOnly = true) {
    try {
      const roomName = `commercial-${commercialId}`
      const participantIdentity = `commercial-${commercialId}`

      const data = await graphqlClient.request(START_RECORDING, {
        input: {
          roomName,
          audioOnly,
          participantIdentity,
        },
      })

      return data.startRecording
    } catch (error) {
      console.error('Erreur démarrage enregistrement:', error)
      throw error
    }
  }

  /**
   * Arrête un enregistrement
   */
  static async stopRecording(egressId) {
    try {
      const data = await graphqlClient.request(STOP_RECORDING, {
        input: { egressId },
      })

      return data.stopRecording
    } catch (error) {
      console.error('Erreur arrêt enregistrement:', error)
      throw error
    }
  }

  /**
   * Formate la taille du fichier en format lisible
   */
  static formatFileSize(bytes) {
    if (!bytes) return '0 B'

    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  /**
   * Génère une URL optimisée pour le streaming
   */
  static async getStreamingUrl(key) {
    try {
      const data = await graphqlClient.request(GET_STREAMING_URL, { key })
      return data.getStreamingUrl
    } catch (error) {
      console.error('Erreur génération URL streaming:', error)
      throw error
    }
  }

  /**
   * Télécharge un enregistrement
   */
  static downloadRecording(url, filename) {
    if (!url) return

    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'recording.mp4'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export default RecordingService
