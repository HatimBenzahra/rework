import { captureException } from '../config/sentry.js'

/**
 * Gestionnaire d'erreurs global pour l'application
 * Capture toutes les erreurs non gérées et les log
 */

class ErrorHandler {
  constructor() {
    this.errors = []
    this.maxErrors = 50 // Garder les 50 dernières erreurs
    this.listeners = []
  }

  /**
   * Initialiser les listeners d'erreurs globaux
   */
  init() {
    // Capturer les erreurs JavaScript non gérées
    window.addEventListener('error', this.handleError.bind(this))

    // Capturer les promesses rejetées non gérées
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this))

    // Capturer les erreurs de chargement de ressources
    window.addEventListener(
      'error',
      event => {
        if (event.target !== window) {
          this.handleResourceError(event)
        }
      },
      true
    )

    // Only log in development
    if (import.meta.env.DEV) {
      console.log('✅ ErrorHandler initialisé - Toutes les erreurs seront capturées')
    }
  }

  /**
   * Gérer les erreurs JavaScript
   */
  handleError(event) {
    const error = {
      type: 'javascript',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    this.logError(error)
    this.notifyListeners(error)

    // Ne pas empêcher le comportement par défaut pour que l'erreur soit toujours visible en console
    return false
  }

  /**
   * Gérer les promesses rejetées non gérées
   */
  handlePromiseRejection(event) {
    const error = {
      type: 'promise',
      message: event.reason?.message || event.reason || 'Promise rejection',
      reason: event.reason,
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    this.logError(error)
    this.notifyListeners(error)

    // Empêcher l'erreur d'être affichée dans la console (déjà loggée)
    event.preventDefault()
  }

  /**
   * Gérer les erreurs de chargement de ressources (images, scripts, etc.)
   */
  handleResourceError(event) {
    const error = {
      type: 'resource',
      message: `Failed to load resource: ${event.target.src || event.target.href}`,
      resource: event.target.tagName,
      src: event.target.src || event.target.href,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    }

    this.logError(error)
    this.notifyListeners(error)
  }

  /**
   * Logger une erreur manuellement
   */
  logError(error) {
    // Ajouter à la liste des erreurs
    this.errors.push(error)

    // Garder seulement les N dernières erreurs
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Logger en console en développement
    if (import.meta.env.DEV) {
      console.group(`🔴 ${error.type.toUpperCase()} ERROR`)
      console.error('Message:', error.message)
      if (error.stack) console.error('Stack:', error.stack)
      console.error('Details:', error)
      console.groupEnd()
    }

    // Always send to monitoring in production
    this.sendToMonitoring(error)
  }

  /**
   * Envoyer l'erreur à un service de monitoring externe
   */
  sendToMonitoring(error) {
    // Éviter les boucles infinies : ne pas envoyer les erreurs Sentry à Sentry
    if (error.message?.includes('Sentry') || error.stack?.includes('Sentry')) {
      return
    }

    try {
      // Créer une vraie Error si ce n'est pas déjà le cas
      let errorToSend = error.error

      if (!errorToSend || !(errorToSend instanceof Error)) {
        errorToSend = new Error(error.message || 'Unknown error')
        errorToSend.name = error.type || 'UnknownError'
      }

      // Capturer l'exception dans Sentry (si configuré)
      // Inclure toutes les métadonnées pertinentes selon le type d'erreur
      const extra = {
        type: error.type,
        url: error.url,
        timestamp: error.timestamp,
      }

      // Ajouter les données spécifiques selon le type
      if (error.type === 'javascript') {
        extra.filename = error.filename
        extra.lineno = error.lineno
        extra.colno = error.colno
      } else if (error.type === 'resource') {
        extra.resource = error.resource
        extra.src = error.src
      } else if (error.type === 'promise') {
        extra.reason = error.reason
      }

      const sent = captureException(errorToSend, { extra })

      // Only log success in development
      if (sent && import.meta.env.DEV) {
        console.log('📤 Erreur envoyée à Sentry')
      }
    } catch (sentryError) {
      // Ne surtout PAS logger cette erreur pour éviter la boucle infinie
      // Silent fail en production
      if (import.meta.env.DEV) {
        console.warn('⚠️ Échec envoi Sentry (ignoré):', sentryError.message)
      }
    }
  }

  /**
   * Ajouter un listener qui sera notifié de chaque erreur
   */
  addListener(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Notifier tous les listeners
   */
  notifyListeners(error) {
    this.listeners.forEach(callback => {
      try {
        callback(error)
      } catch (err) {
        console.error('Error in error listener:', err)
      }
    })
  }

  /**
   * Récupérer toutes les erreurs
   */
  getErrors() {
    return this.errors
  }

  /**
   * Nettoyer toutes les erreurs
   */
  clearErrors() {
    this.errors = []
  }

  /**
   * Nettoyer les listeners
   */
  cleanup() {
    window.removeEventListener('error', this.handleError)
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection)
    this.listeners = []
  }
}

// Instance singleton
export const errorHandler = new ErrorHandler()

// Auto-initialiser
if (typeof window !== 'undefined') {
  errorHandler.init()
}
