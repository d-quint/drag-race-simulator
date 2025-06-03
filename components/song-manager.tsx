"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Music, Shuffle, ListMusic, Link } from "lucide-react"
import type { Song } from "@/lib/types"
import { 
  initiateSpotifyAuth,
  isSpotifyAuthenticated,
  getUserPlaylists,
  getPlaylistTracks,
  getPlaylist,
  transformSpotifyTrackToSong,
  extractPlaylistId
} from "@/lib/spotify-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface SongManagerProps {
  songs: Song[]
  setSongs: (songs: Song[]) => void
}

// Custom Spotify icon component since Lucide doesn't have one
function SpotifyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 11.5a7 7 0 0 1 8 0M6.5 15a9 9 0 0 1 11 0M6 18.5a11 11 0 0 1 12 0" />
    </svg>
  )
}

export function SongManager({ songs, setSongs }: SongManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    genre: "",
  })
  
  const [isSpotifyDialogOpen, setIsSpotifyDialogOpen] = useState(false)
  const [isLoggedIntoSpotify, setIsLoggedIntoSpotify] = useState(false)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null)
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([])
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false)
  const [isLoadingTracks, setIsLoadingTracks] = useState(false)
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [isLoadingUrlPlaylist, setIsLoadingUrlPlaylist] = useState(false)
  const [urlError, setUrlError] = useState("")
  
  // Check if user is authenticated with Spotify
  useEffect(() => {
    setIsLoggedIntoSpotify(isSpotifyAuthenticated())
  }, [isSpotifyDialogOpen])

  const genres = [
    "Pop",
    "Dance",
    "R&B",
    "Hip Hop",
    "Rock",
    "Country",
    "Electronic",
    "Disco",
    "Funk",
    "Soul",
    "Alternative",
    "Indie",
    "Classic",
    "Ballad",
  ]

  const resetForm = () => {
    setFormData({ title: "", artist: "", genre: "" })
    setIsAdding(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.artist.trim() || !formData.genre) return

    const newSong: Song = {
      ...formData,
      id: Date.now().toString(),
    }
    setSongs([...songs, newSong])
    resetForm()
  }

  const handleDelete = (id: string) => {
    setSongs(songs.filter((song) => song.id !== id))
  }

  const generateRandomSongs = () => {
    const sampleSongs = [
      { title: "I Will Survive", artist: "Gloria Gaynor", genre: "Disco" },
      { title: "Stronger", artist: "Britney Spears", genre: "Pop" },
      { title: "Respect", artist: "Aretha Franklin", genre: "Soul" },
      { title: "Bad Romance", artist: "Lady Gaga", genre: "Pop" },
      { title: "Dancing Queen", artist: "ABBA", genre: "Disco" },
      { title: "Roar", artist: "Katy Perry", genre: "Pop" },
      { title: "Fighter", artist: "Christina Aguilera", genre: "Pop" },
      { title: "Confident", artist: "Demi Lovato", genre: "Pop" },
      { title: "Stronger (What Doesn't Kill You)", artist: "Kelly Clarkson", genre: "Pop" },
      { title: "Titanium", artist: "David Guetta ft. Sia", genre: "Electronic" },
      { title: "Firework", artist: "Katy Perry", genre: "Pop" },
      { title: "Born This Way", artist: "Lady Gaga", genre: "Pop" },
      { title: "Shake It Off", artist: "Taylor Swift", genre: "Pop" },
      { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", genre: "Funk" },
      { title: "Can't Stop the Feeling", artist: "Justin Timberlake", genre: "Pop" },
    ]

    const newSongs = sampleSongs.slice(0, 10).map((song, index) => ({
      ...song,
      id: (Date.now() + index).toString(),
    }))

    setSongs([...songs, ...newSongs])
  }

  // Spotify Integration Functions
  const handleConnectSpotify = async () => {
    try {
      await initiateSpotifyAuth();
    } catch (error) {
      console.error('Failed to initiate Spotify auth:', error);
    }
  };

  const handleLoadSpotifyPlaylists = async () => {
    if (!isLoggedIntoSpotify) {
      return;
    }

    setIsLoadingPlaylists(true);
    try {
      const response = await getUserPlaylists();
      setPlaylists(response.items);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleSelectPlaylist = async (playlist: any) => {
    setSelectedPlaylist(playlist);
    setIsLoadingTracks(true);
    try {
      const response = await getPlaylistTracks(playlist.id);
      setPlaylistTracks(response.items);
    } catch (error) {
      console.error('Error loading tracks:', error);
      setPlaylistTracks([]);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleImportSong = (track: any) => {
    if (!track?.track) return;
    
    const newSong = transformSpotifyTrackToSong(track);
    if (newSong) {
      // Check if song already exists
      const exists = songs.some(s => s.spotify_uri === newSong.spotify_uri);
      if (!exists) {
        setSongs([...songs, newSong]);
      }
    }
  };

  const handleImportAllSongs = () => {
    if (!playlistTracks.length) return;
    
    const newSongs = playlistTracks
      .map(transformSpotifyTrackToSong)
      .filter((song): song is Song => song !== null)
      .filter(newSong => !songs.some(s => s.spotify_uri === newSong.spotify_uri));
    
    if (newSongs.length > 0) {
      setSongs([...songs, ...newSongs]);
    }
    
    setIsSpotifyDialogOpen(false);
  };

  // This function was replaced by handleLoadPlaylistUrl

  // Handle loading a playlist directly from URL
  const handleLoadPlaylistUrl = async () => {
    if (!isLoggedIntoSpotify) {
      return;
    }

    // Reset previous errors
    setUrlError("");
    
    if (!playlistUrl.trim()) {
      setUrlError("Please enter a Spotify playlist URL");
      return;
    }
    
    const playlistId = extractPlaylistId(playlistUrl);
    
    if (!playlistId) {
      setUrlError("Invalid Spotify playlist URL or ID");
      return;
    }
    
    setIsLoadingUrlPlaylist(true);
    try {
      // First get the playlist details
      const playlist = await getPlaylist(playlistId);
      setSelectedPlaylist(playlist);
      
      // Then get the tracks
      const response = await getPlaylistTracks(playlistId);
      setPlaylistTracks(response.items);
    } catch (error) {
      console.error('Error loading playlist from URL:', error);
      setUrlError("Failed to load playlist. Please check the URL and try again.");
      setPlaylistTracks([]);
    } finally {
      setIsLoadingUrlPlaylist(false);
    }
  };

  // Open Spotify dialog and load playlists if logged in
  const handleOpenSpotifyDialog = () => {
    setIsSpotifyDialogOpen(true);
    if (isLoggedIntoSpotify && playlists.length === 0) {
      handleLoadSpotifyPlaylists();
    }
  };

  // Spotify Dialog Component
  const renderSpotifyDialog = () => {
    return (
      <Dialog open={isSpotifyDialogOpen} onOpenChange={setIsSpotifyDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] w-[95vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SpotifyIcon className="w-5 h-5 text-green-500" />
              Import Songs from Spotify
            </DialogTitle>
            <DialogDescription>
              Select a playlist to import songs for lip sync battles
            </DialogDescription>
          </DialogHeader>
          
          {!isLoggedIntoSpotify ? (
            <div className="text-center py-8">
              <SpotifyIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <p className="mb-4">Connect your Spotify account to import songs</p>
              <div className="flex flex-col items-center space-y-2">
                <Button onClick={handleConnectSpotify} className="bg-green-500 hover:bg-green-600">
                  Connect with Spotify
                </Button>
              </div>
            </div>
          ) : (
            <>  
              <div className="grid md:grid-cols-[280px_1fr] gap-6">
                {/* Playlists sidebar */}
                <div className="border-r pr-4">
                  <h3 className="font-medium mb-3 text-base">Your Playlists</h3>
                  {isLoadingPlaylists ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                      {playlists.map((playlist) => (
                        <div
                          key={playlist.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                            selectedPlaylist?.id === playlist.id ? 'bg-gray-100 border-l-4 border-green-500' : ''
                          }`}
                          onClick={() => handleSelectPlaylist(playlist)}
                        >
                          <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0">
                            {playlist.images?.[0]?.url && (
                              <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium truncate">{playlist.name}</p>
                            <p className="text-xs text-gray-500">{playlist.tracks.total} tracks</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              
              {/* Tracks list */}
              <div>
                {selectedPlaylist ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-base truncate mr-2">Tracks in {selectedPlaylist.name}</h3>
                      <Button
                        onClick={handleImportAllSongs}
                        disabled={!playlistTracks.length}
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        Import All
                      </Button>
                    </div>
                    {isLoadingTracks ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                        {playlistTracks.map((track) => (
                          <div
                            key={track.track?.id}
                            className="flex items-center justify-between p-2 rounded hover:bg-gray-100"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0">
                                {track.track?.album?.images?.[0]?.url && (
                                  <img
                                    src={track.track.album.images[0].url}
                                    alt={track.track.album.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{track.track?.name}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {track.track?.artists?.map((artist: any) => artist.name).join(", ")}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleImportSong(track)}
                              variant="outline"
                              size="sm"
                              className="ml-2 whitespace-nowrap"
                            >
                              Import
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <ListMusic className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500">Select a playlist to see tracks</p>
                  </div>
                )}
              </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={() => setIsAdding(true)} className="flex-1">
          <Plus className="w-4 h-4 mr-2" />
          Add New Song
        </Button>
        <Button onClick={handleOpenSpotifyDialog} className="flex-1 bg-green-500 hover:bg-green-600">
          <SpotifyIcon className="w-4 h-4 mr-2" />
          Import from Spotify
        </Button>
        <Button onClick={generateRandomSongs} variant="outline" className="flex-1">
          <Shuffle className="w-4 h-4 mr-2" />
          Generate Random Songs
        </Button>
      </div>
      
      {/* Quick Spotify Playlist URL Import */}
      <div className="flex flex-col sm:flex-row gap-2 items-center p-3 bg-green-50 border border-green-100 rounded-md">
        <div className="flex items-center text-sm font-medium text-green-700 mr-2">
          <SpotifyIcon className="w-4 h-4 mr-2 text-green-600" /> 
          Import playlist directly:
        </div>
        {isLoggedIntoSpotify ? (
          <>
            <div className="flex-1">
              <Input
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="Paste Spotify playlist URL here..."
                className="text-sm h-9"
              />
            </div>
            <Button 
              onClick={() => {
                handleLoadPlaylistUrl();
                if (!urlError) setIsSpotifyDialogOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 h-9 whitespace-nowrap"
              disabled={isLoadingUrlPlaylist || !playlistUrl}
              size="sm"
            >
              {isLoadingUrlPlaylist ? (
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
              ) : null}
              Import Songs
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1 text-sm text-gray-600">
              Connect to Spotify first to import playlists
            </div>
            <Button 
              onClick={handleConnectSpotify}
              className="bg-green-600 hover:bg-green-700 h-9 mr-2"
              size="sm"
            >
              Connect Spotify
            </Button>
          </>
        )}
        {urlError && <p className="text-xs text-red-500 w-full mt-1">{urlError}</p>}
      </div>

      {isAdding && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle>Add New Song</CardTitle>
            <CardDescription>Add a song to your lip sync library</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Song Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter song title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="artist">Artist</Label>
                <Input
                  id="artist"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  placeholder="Enter artist name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="genre">Genre</Label>
                <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Add Song
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Songs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {songs.map((song) => (
          <Card key={song.id} className="hover:shadow-md transition-shadow overflow-hidden group">
            <div className="flex flex-row h-full relative">
              {/* Album art column for Spotify songs */}
              <div className={`${song.album_image ? 'w-1/4' : 'hidden'} bg-black flex-shrink-0`}>
                <img 
                  src={song.album_image || '/placeholder.svg'} 
                  alt={`${song.title} album art`} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Content column */}
              <div className={`${song.album_image ? 'w-3/4' : 'w-full'} flex flex-col`}>
                {/* Delete button - positioned absolutely and only visible on hover */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(song.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Remove song"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>

                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {song.spotify_uri ? (
                      <SpotifyIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Music className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    )}
                    <div>
                      <CardTitle className="text-base font-medium mb-0 truncate">
                        {song.title}
                      </CardTitle>
                      <CardDescription className="text-sm mt-0">
                        {song.artist}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {song.genre}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-3 flex-1 flex flex-col justify-end">
                  {song.preview_url && (
                    <div className="mt-auto">
                      <audio
                        src={song.preview_url}
                        controls
                        className="w-full h-8"
                      />
                    </div>
                  )}
                </CardContent>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {songs.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No songs added yet. Add some songs for lip sync battles!</p>
        </div>
      )}

      {/* Spotify Integration */}
      {renderSpotifyDialog()}
    </div>
  )
}
