// Spotify API integration for the drag race simulator
// Uses the Authorization Code with PKCE flow for client-side authentication

const CLIENT_ID = '5af3a96306ad4ba0bb9f55a9b2df3c4d';

// Helper function to get the correct redirect URI
const getRedirectUri = (): string => {
  if (typeof window === 'undefined') return '';
  
  const { protocol, hostname, port } = window.location;
  
  // Use explicit loopback IP instead of localhost as Spotify doesn't allow "localhost" in redirect URI
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//127.0.0.1${portSuffix}/spotifycallback`;
  }
  
  // For production/deployed sites
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/spotifycallback`;
};

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_ENDPOINT = 'https://api.spotify.com/v1';

// Scopes we need for our application
const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-private',
];

/**
 * Get the current Spotify Client ID
 */
export const getCurrentSpotifyClientId = (): string => {
  return CLIENT_ID;
};

/**
 * Generate a random string for state verification
 */
export const generateRandomString = (length: number): string => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/**
 * Generate code verifier for PKCE
 */
const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Generate code challenge for PKCE
 */
const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Extract Spotify playlist ID from a variety of Spotify playlist URL formats
 */
export const extractPlaylistId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    // Handle various Spotify URL formats
    // Format 1: https://open.spotify.com/playlist/37i9dQZF1DX4fpCWaHOp4n
    // Format 2: https://open.spotify.com/playlist/37i9dQZF1DX4fpCWaHOp4n?si=...
    // Format 3: spotify:playlist:37i9dQZF1DX4fpCWaHOp4n
    
    // For web URLs (open.spotify.com)
    if (url.includes('open.spotify.com/playlist/')) {
      const match = url.match(/playlist\/([a-zA-Z0-9]+)(\?|$)/);
      if (match && match[1]) return match[1];
    }
    
    // For Spotify URI format (spotify:playlist:ID)
    if (url.startsWith('spotify:playlist:')) {
      const parts = url.split(':');
      if (parts.length === 3) return parts[2];
    }
    
    // For plain IDs (37i9dQZF1DX4fpCWaHOp4n)
    if (/^[a-zA-Z0-9]{22}$/.test(url)) {
      return url;
    }
  } catch (error) {
    console.error('Error extracting playlist ID:', error);
  }
  
  return null;
};

/**
 * Initiate the Spotify authorization flow using Authorization Code with PKCE
 */
export const initiateSpotifyAuth = async (): Promise<void> => {
  console.log('Starting Spotify authorization with PKCE...');
  
  // Get the current client ID (either from localStorage or environment variable)
  const clientId = getCurrentSpotifyClientId();
  
  if (!clientId) {
    console.error('Spotify Client ID is not configured');
    alert('Please configure your Spotify Client ID first');
    return;
  }

  // Validate client ID format (should be 32 characters)
  if (!/^[a-f0-9]{32}$/.test(clientId)) {
    console.warn('Client ID format looks unusual. Expected 32 hexadecimal characters.');
  }

  // Get the redirect URI dynamically
  const redirectUri = getRedirectUri();
  if (!redirectUri) {
    console.error('Redirect URI could not be determined');
    return;
  }

  console.log('Current window location:', window.location.href);
  console.log('Computed redirect URI:', redirectUri);

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);
  
  // Store the state and code verifier in localStorage
  try {
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');
    localStorage.setItem('spotify_auth_state', state);
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    console.log('Setting auth state:', state);
    console.log('Using client ID:', `${clientId.substring(0, 8)}...${clientId.substring(24)}`);
    console.log('Using redirect URI:', redirectUri);
  } catch (e) {
    console.error('Failed to save auth parameters to localStorage:', e);
  }

  // Construct the authorization URL with PKCE parameters
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',  // Changed from 'token' to 'code'
    redirect_uri: redirectUri,
    state: state,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'true'
  });

  const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
  console.log('Final auth URL (truncated):', authUrl.substring(0, 100) + '...');
  
  // Validate the URL before navigating
  try {
    new URL(authUrl);
    console.log('Auth URL validation passed');
  } catch (error) {
    console.error('Malformed auth URL:', error);
    return;
  }
  
  // Navigate to the authorization URL
  console.log('Redirecting to Spotify authorization...');
  window.location.href = authUrl;
};

/**
 * Process the auth callback from Spotify (Authorization Code with PKCE)
 */
export const processSpotifyAuthCallback = async (): Promise<{ 
  accessToken: string | null,
  error: string | null
}> => {
  if (typeof window === 'undefined') return { accessToken: null, error: 'Not in browser' };

  console.log('Processing Spotify auth callback...');
  console.log('Current URL:', window.location.href);

  // Parse URL parameters (code and state come as query parameters, not hash)
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  console.log('Received code:', code ? 'present' : 'missing');
  console.log('Received state:', state);
  console.log('Received error:', error);

  if (error) {
    console.error('Spotify auth error:', error);
    return { accessToken: null, error: error };
  }

  const storedState = localStorage.getItem('spotify_auth_state');
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  
  console.log('Stored state:', storedState);
  console.log('Code verifier:', codeVerifier ? 'present' : 'missing');
  
  if (state !== storedState) {
    console.error('State mismatch detected');
    return { 
      accessToken: null, 
      error: 'State mismatch. Possible CSRF attack.' 
    };
  }

  if (!code) {
    return { accessToken: null, error: 'No authorization code received' };
  }

  if (!codeVerifier) {
    return { accessToken: null, error: 'No code verifier found' };
  }

  // Clean up stored auth parameters
  localStorage.removeItem('spotify_auth_state');
  localStorage.removeItem('spotify_code_verifier');

  // Exchange authorization code for access token
  try {
    const clientId = getCurrentSpotifyClientId();
    const redirectUri = getRedirectUri();
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token exchange failed:', response.status, errorData);
      return { accessToken: null, error: `Token exchange failed: ${response.statusText}` };
    }

    const data = await response.json();
    
    if (data.access_token) {
      console.log('Access token received successfully');
      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('spotify_token_expiry', 
        String(Date.now() + data.expires_in * 1000));
      
      // Store refresh token if provided
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }
      
      return { accessToken: data.access_token, error: null };
    }

    return { accessToken: null, error: 'No access token in response' };
  } catch (error) {
    console.error('Error during token exchange:', error);
    return { accessToken: null, error: 'Failed to exchange code for token' };
  }
};

/**
 * Get a valid Spotify access token or return null
 */
export const getSpotifyToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('spotify_access_token');
  const expiry = localStorage.getItem('spotify_token_expiry');
  
  if (!token || !expiry) return null;
  
  // Check if token has expired
  if (Date.now() > parseInt(expiry)) {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
    return null;
  }
  
  return token;
};

/**
 * Check if the user is authenticated with Spotify
 */
export const isSpotifyAuthenticated = (): boolean => {
  // First check if client ID is configured
  const clientId = getCurrentSpotifyClientId();
  if (!clientId) return false;
  
  // Then check if we have a valid token
  return getSpotifyToken() !== null;
};

/**
 * Make a request to the Spotify API
 */
export const spotifyApiRequest = async (endpoint: string, method: string = 'GET', body?: object) => {
  const token = getSpotifyToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${SPOTIFY_API_ENDPOINT}${endpoint}`, options);
  
  if (!response.ok) {
    // Handle 401 specifically - token expired
    if (response.status === 401) {
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_token_expiry');
      throw new Error('Spotify authentication expired');
    }
    
    throw new Error(`Spotify API error: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Get user's playlists
 */
export const getUserPlaylists = async (limit = 50, offset = 0) => {
  return await spotifyApiRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
};

/**
 * Get a specific playlist by ID
 */
export const getPlaylist = async (playlistId: string) => {
  return await spotifyApiRequest(`/playlists/${playlistId}`);
};

/**
 * Get playlist tracks
 */
export const getPlaylistTracks = async (playlistId: string, limit = 100, offset = 0) => {
  return await spotifyApiRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
};

/**
 * Check if a track has an audio preview URL
 */
export const hasPreviewUrl = (track: any): boolean => {
  return !!track?.preview_url;
};

/**
 * Extract song information from Spotify track format
 */
export const transformSpotifyTrackToSong = (track: any): Song | null => {
  if (!track || !track.track) return null;
  
  const { id, name, artists, album, preview_url } = track.track;
  
  return {
    id,
    title: name,
    artist: artists.map((a: any) => a.name).join(', '),
    genre: 'Imported from Spotify',
    album_image: album?.images?.[0]?.url || '',
    preview_url,
    spotify_uri: track.track.uri,
    hasPreview: !!preview_url
  };
};

// Type for Song to match the app's interface
interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  album_image?: string;
  preview_url?: string;
  spotify_uri?: string;
  hasPreview?: boolean;
}
