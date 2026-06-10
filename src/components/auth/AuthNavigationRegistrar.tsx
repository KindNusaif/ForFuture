import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerAuthNavigate, unregisterAuthNavigate } from '../../lib/authNavigation'

/** Registers React Router navigate for AuthContext logout (must live inside BrowserRouter). */
export default function AuthNavigationRegistrar() {
  const navigate = useNavigate()

  useEffect(() => {
    registerAuthNavigate(navigate)
    return () => unregisterAuthNavigate()
  }, [navigate])

  return null
}
