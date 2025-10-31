import React, { createContext, useContext, useState } from 'react'

const DetailsSectionsContext = createContext()

export function DetailsSectionsProvider({ children }) {
  const [sections, setSections] = useState([])
  const [focusedSection, setFocusedSection] = useState(null)

  return (
    <DetailsSectionsContext.Provider
      value={{ sections, setSections, focusedSection, setFocusedSection }}
    >
      {children}
    </DetailsSectionsContext.Provider>
  )
}

export function useDetailsSections() {
  const context = useContext(DetailsSectionsContext)
  if (!context) {
    throw new Error('useDetailsSections must be used within a DetailsSectionsProvider')
  }
  return context
}
