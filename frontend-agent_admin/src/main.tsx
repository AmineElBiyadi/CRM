import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { router } from './router'
import './styles.css'

const GOOGLE_CLIENT_ID = "872849833889-gomdkpkmf1cuu5f7f9fc0khlo9mp4ni0.apps.googleusercontent.com"

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </React.StrictMode>,
  )
}
