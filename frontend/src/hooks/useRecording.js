import { useState, useEffect, useCallback, useRef } from 'react'
import { RecordingService } from '@/services/recordings'

/**
 * Hook pour gérer l'enregistrement automatique des commerciaux
 * Se déclenche automatiquement selon le flow :
 * - START: Navigation vers page des portes (PortesGestion) + Connexion LiveKit active
 * - STOP: Retour vers liste des immeubles (click bouton retour)
 */
export function useRecording(commercialId, enabled = false, audioConnected = false) {
  const [isRecording, setIsRecording] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [error, setError] = useState(null)
  const [recordingData, setRecordingData] = useState(null)

  // Ref pour éviter les doubles déclenchements
  const isProcessingRef = useRef(false)
  const currentEgressIdRef = useRef(null)

  /**
   * Démarre l'enregistrement automatiquement
   */
  const startRecording = useCallback(async () => {
    if (!commercialId || !enabled || !audioConnected || isProcessingRef.current || isRecording) {
      console.log('🚫 Enregistrement non démarré:', {
        commercialId,
        enabled,
        audioConnected,
        isProcessing: isProcessingRef.current,
        isRecording,
      })
      return
    }

    try {
      isProcessingRef.current = true
      setIsStarting(true)
      setError(null)

      console.log('🎤 Démarrage enregistrement pour commercial:', commercialId)
      console.log('📋 État avant startRecording:', {
        commercialId,
        enabled,
        isRecording,
        isProcessingRef: isProcessingRef.current,
      })

      const result = await RecordingService.startRecording(commercialId, true)
      console.log('🎯 Result from RecordingService:', result)

      console.log('✅ Enregistrement démarré:', result)

      setRecordingData(result)
      setIsRecording(true)
      currentEgressIdRef.current = result.egressId
    } catch (err) {
      console.error('❌ Erreur démarrage enregistrement:', err)
      setError(err.message || 'Erreur de démarrage')
      setIsRecording(false)
    } finally {
      setIsStarting(false)
      isProcessingRef.current = false
    }
  }, [commercialId, enabled, audioConnected, isRecording])

  /**
   * Arrête l'enregistrement et upload vers S3
   */
  const stopRecording = useCallback(async () => {
    if (!currentEgressIdRef.current || !isRecording || isProcessingRef.current) {
      console.log('🚫 Arrêt enregistrement ignoré:', {
        egressId: currentEgressIdRef.current,
        isRecording,
        isProcessing: isProcessingRef.current,
      })
      return
    }

    try {
      isProcessingRef.current = true
      setIsStopping(true)
      setError(null)

      console.log('🛑 Arrêt enregistrement, egressId:', currentEgressIdRef.current)

      const success = await RecordingService.stopRecording(currentEgressIdRef.current)

      if (success) {
        console.log('✅ Enregistrement arrêté et envoyé vers S3')
        setIsRecording(false)
        setRecordingData(null)
        currentEgressIdRef.current = null
      } else {
        console.warn('⚠️ Arrêt enregistrement: statut non confirmé')
      }
    } catch (err) {
      console.error('❌ Erreur arrêt enregistrement:', err)
      setError(err.message || "Erreur d'arrêt")
    } finally {
      setIsStopping(false)
      isProcessingRef.current = false
    }
  }, [isRecording])

  /**
   * Fonction manuelle pour forcer l'arrêt (fallback)
   */
  const forceStop = useCallback(async () => {
    if (currentEgressIdRef.current) {
      try {
        await RecordingService.stopRecording(currentEgressIdRef.current)
        console.log("🔧 Arrêt forcé de l'enregistrement")
      } catch (err) {
        console.error('❌ Erreur arrêt forcé:', err)
      } finally {
        // Reset état local dans tous les cas
        setIsRecording(false)
        setRecordingData(null)
        currentEgressIdRef.current = null
        isProcessingRef.current = false
      }
    }
  }, [])

  /**
   * Démarrage automatique quand enabled passe à true
   */
  useEffect(() => {
    if (enabled && audioConnected && !isRecording && !isProcessingRef.current) {
      // Délai pour laisser la connexion audio se stabiliser
      const timer = setTimeout(() => {
        startRecording()
      }, 2000) // 2 secondes après connexion audio

      return () => clearTimeout(timer)
    }
  }, [enabled, audioConnected, startRecording, isRecording])

  /**
   * Arrêt automatique quand enabled passe à false
   */
  useEffect(() => {
    if (!enabled && isRecording) {
      stopRecording()
    }
  }, [enabled, isRecording, stopRecording])

  /**
   * Nettoyage à la déconnexion du composant
   */
  useEffect(() => {
    return () => {
      console.log('🧹 Nettoyage hook useRecording, egressId:', currentEgressIdRef.current)
      if (currentEgressIdRef.current) {
        // Tentative d'arrêt propre avant démontage
        RecordingService.stopRecording(currentEgressIdRef.current)
          .then(() => console.log('✅ Enregistrement arrêté lors du nettoyage'))
          .catch(err => console.error('❌ Erreur nettoyage enregistrement:', err))
      }
    }
  }, [])

  return {
    // État
    isRecording,
    isStarting,
    isStopping,
    error,
    recordingData,

    // Actions manuelles (si besoin)
    startRecording,
    stopRecording,
    forceStop,

    // Données
    egressId: currentEgressIdRef.current,
    s3Key: recordingData?.s3Key,
    status: recordingData?.status,
  }
}

export default useRecording
