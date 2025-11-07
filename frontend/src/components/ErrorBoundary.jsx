import React from 'react'
import ErrorFallback from './ErrorFallback'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour que le prochain rendu affiche l'UI de secours
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur dans la console
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Sauvegarder les détails de l'erreur dans l'état
    this.setState({
      error: error,
      errorInfo: errorInfo,
    })

    // Vous pouvez aussi envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, etc.
    // logErrorToService(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Afficher la page d'erreur personnalisée
      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />
    }

    return this.props.children
  }
}

export default ErrorBoundary
