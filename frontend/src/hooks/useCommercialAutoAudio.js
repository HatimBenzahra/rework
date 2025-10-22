import { useState, useEffect, useRef, useCallback } from 'react'
import { AudioMonitoringService, LiveKitUtils } from '@/services/audio-monitoring'

/**
 * Hook pour gérer l'audio monitoring automatique des commerciaux
 * Se connecte automatiquement quand le commercial se connecte à son espace
 */
export function useCommercialAutoAudio(commercialId, enabled = true) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [connectionDetails, setConnectionDetails] = useState(null)
  
  const roomRef = useRef(null)
  const audioStreamRef = useRef(null)

  // Fonction pour démarrer la connexion audio
  const startAudioPublishing = useCallback(async () => {
    if (!commercialId || !enabled || isConnecting || isConnected) {
      return
    }

    try {
      setIsConnecting(true)
      setError(null)

      // 1. Générer le token commercial
      console.log('🎤 Génération token commercial...', commercialId)
      const details = await AudioMonitoringService.generateCommercialToken(commercialId)
      setConnectionDetails(details)

      // 2. Se connecter à LiveKit comme publisher
      console.log('🎤 Connexion LiveKit...', details.roomName)
      const room = await LiveKitUtils.connectAsCommercial(details)
      roomRef.current = room

      // 3. Marquer comme connecté
      setIsConnected(true)
      console.log('✅ Audio monitoring actif pour commercial', commercialId)

      // 4. Gérer les événements de déconnexion
      room.on('disconnected', () => {
        console.log('🔌 Commercial déconnecté de LiveKit')
        setIsConnected(false)
        setConnectionDetails(null)
        roomRef.current = null
      })

    } catch (err) {
      console.error('❌ Erreur connexion audio:', err)
      setError(err.message || 'Erreur de connexion audio')
      setIsConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }, [commercialId, enabled, isConnecting, isConnected])

  // Fonction pour arrêter la connexion audio
  const stopAudioPublishing = useCallback(async () => {
    try {
      if (roomRef.current) {
        await LiveKitUtils.disconnect(roomRef.current)
        roomRef.current = null
      }
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }

      setIsConnected(false)
      setConnectionDetails(null)
      setError(null)
      console.log('🔇 Audio monitoring arrêté')
    } catch (err) {
      console.error('Erreur arrêt audio:', err)
    }
  }, [])

  // Fonction pour redémarrer la connexion
  const restartAudioPublishing = useCallback(async () => {
    await stopAudioPublishing()
    await startAudioPublishing()
  }, [stopAudioPublishing, startAudioPublishing])

  // Démarrage automatique quand le commercial se connecte
  useEffect(() => {
    if (commercialId && enabled && !isConnected && !isConnecting) {
      // Délai pour laisser le temps au layout de se charger
      const timer = setTimeout(() => {
        startAudioPublishing()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [commercialId, enabled, isConnected, isConnecting, startAudioPublishing])

  // Nettoyage à la déconnexion du composant
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        LiveKitUtils.disconnect(roomRef.current)
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    // État
    isConnected,
    isConnecting,
    error,
    connectionDetails,
    
    // Actions
    startAudioPublishing,
    stopAudioPublishing,
    restartAudioPublishing,
    
    // Données
    roomName: connectionDetails?.roomName,
    participantName: connectionDetails?.participantName,
  }
}

export default useCommercialAutoAudio