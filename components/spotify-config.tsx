"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { saveUserSpotifyClientId, getCurrentSpotifyClientId } from "@/lib/spotify-api"

interface SpotifyConfigProps {
  onConfigured: () => void
  isOpen: boolean
  onClose: () => void
}

export function SpotifyConfig({ onConfigured, isOpen, onClose }: SpotifyConfigProps) {
  const [clientId, setClientId] = useState("")
  const [error, setError] = useState("")
  
  useEffect(() => {
    // Load existing client ID if available
    const currentClientId = getCurrentSpotifyClientId()
    if (currentClientId) {
      setClientId(currentClientId)
    }
  }, [])

  const handleSave = () => {
    if (!clientId.trim()) {
      setError("Client ID cannot be empty")
      return
    }
    
    try {
      saveUserSpotifyClientId(clientId.trim())
      setError("")
      onConfigured()
      onClose()
    } catch (err) {
      console.error("Error saving Spotify client ID:", err)
      setError("Failed to save client ID")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Spotify Integration</DialogTitle>
          <DialogDescription>
            Enter your Spotify Developer Client ID to enable playlist integration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client-id">Spotify Client ID</Label>
            <Input
              id="client-id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your Spotify Client ID"
            />
            {error && (
              <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              You can get a Client ID from the <a href="https://developer.spotify.com/dashboard" target="_blank" className="text-blue-500 hover:underline">Spotify Developer Dashboard</a>.
              Make sure to add {typeof window !== 'undefined' ? window.location.origin + '/spotify-callback' : '[your-app-url]/spotify-callback'} as a Redirect URI.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}