import { useState, useEffect } from 'react'

export function useKeyboardVisibility() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const visualViewport = window.visualViewport

    if (!visualViewport) {
      return
    }

    const handleResize = () => {
      const windowHeight = window.innerHeight
      const viewportHeight = visualViewport.height
      const heightDiff = windowHeight - viewportHeight

      // On considère que le clavier est ouvert si la différence est significative (> 150px)
      // et que l'élément actif est un input ou textarea
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      
      if (heightDiff > 150 && isInputFocused) {
        setIsKeyboardOpen(true)
        setKeyboardHeight(heightDiff)
      } else {
        setIsKeyboardOpen(false)
        setKeyboardHeight(0)
      }
    }

    const handleScroll = () => {
       if (isKeyboardOpen && document.activeElement) {
         document.activeElement.scrollIntoViewIfNeeded?.()
       }
    }

    visualViewport.addEventListener('resize', handleResize)
    visualViewport.addEventListener('scroll', handleScroll)
    window.addEventListener('focusin', handleResize) // Re-check on focus
    window.addEventListener('focusout', handleResize) // Re-check on blur

    // Initial check
    handleResize()

    return () => {
      visualViewport.removeEventListener('resize', handleResize)
      visualViewport.removeEventListener('scroll', handleScroll)
      window.removeEventListener('focusin', handleResize)
      window.removeEventListener('focusout', handleResize)
    }
  }, []) // Empty dependency array as we bind to window/viewport

  return { isKeyboardOpen, keyboardHeight }
}
