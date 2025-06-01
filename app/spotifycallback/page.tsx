"use client"

import { useEffect, useState } from 'react'
import { processSpotifyAuthCallback } from '@/lib/spotify-api'
import { useRouter } from 'next/navigation'

export default function SpotifyCallback() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { accessToken, error } = await processSpotifyAuthCallback()
        
        if (error) {
          console.error('Spotify authentication error:', error)
          setAuthError(error)
        } else if (accessToken) {
          console.log('Spotify authentication successful')
        }
      } catch (err) {
        console.error('Unexpected error during callback processing:', err)
        setAuthError('Unexpected error occurred')
      } finally {
        setProcessing(false)
        // Redirect back to the song manager tab after a short delay
        setTimeout(() => {
          router.push('/?tab=songs')
        }, 1500)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-pink-100 via-purple-50 to-indigo-100">
      <div className="text-center">
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <h1 className="text-xl mb-2">Processing Spotify Authentication</h1>
            <p>Please wait while we process your Spotify authentication...</p>
          </>
        ) : authError ? (
          <>
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl mb-2 text-red-600">Authentication Failed</h1>
            <p className="text-red-500 mb-4">{authError}</p>
            <p className="text-sm text-gray-600">Redirecting back to the app...</p>
          </>
        ) : (
          <>
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-xl mb-2 text-green-600">Authentication Successful!</h1>
            <p className="text-gray-600">Redirecting back to the app...</p>
          </>
        )}
      </div>
    </div>
  )
}
