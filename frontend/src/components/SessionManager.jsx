import { useEffect, useRef } from 'react'
import { authService } from '@/services/auth.service'
import { useRole } from '@/contexts/userole'

const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const CHECK_INTERVAL = 60 * 1000 // 1 minute
const REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes

export function SessionManager() {
  const { logout } = useRole()
  const lastActivityRef = useRef(Date.now())

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, updateActivity))

    const checkSession = async () => {
      if (!authService.isAuthenticated()) return

      const now = Date.now()
      const idleTime = now - lastActivityRef.current
      // 1. Check Inactivity
      if (idleTime > IDLE_TIMEOUT) {
        console.log('User inactive for 30 mins, logging out')
        logout()
        return
      }

      // 2. Check Token Expiration
      const exp = authService.getTokenExpiration()
      if (exp) {
        const timeUntilExp = exp * 1000 - now
        if (timeUntilExp < REFRESH_THRESHOLD) {
          console.log('Token expiring soon, refreshing...')
          const success = await authService.refreshToken()
          if (!success) {
            logout()
          }
        }
      }
    }

    const intervalId = setInterval(checkSession, CHECK_INTERVAL)

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity))
      clearInterval(intervalId)
    }
  }, [logout])

  return null
}

export default SessionManager
