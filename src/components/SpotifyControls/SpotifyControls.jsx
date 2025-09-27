import { useState, useEffect } from 'react';
import { Play, Pause, Music, Smartphone, SkipForward, SkipBack, Shuffle } from 'lucide-react';
import { spotifyAPI } from '../../services/api';
import { io } from 'socket.io-client';

const SpotifyControls = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [socket, setSocket] = useState(null);
  const [displayDeviceId, setDisplayDeviceId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);

  useEffect(() => {
    // Initialize socket connection - update for production
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    const newSocket = io(serverUrl);
    
    newSocket.on('connect', () => {
      console.log('SpotifyControls connected to server');
    });

    // Listen for display device ready
    newSocket.on('spotify-device-ready', ({ device_id }) => {
      console.log('Display device ready:', device_id);
      setDisplayDeviceId(device_id);
      // Auto-select the display device
      setSelectedDevice(device_id);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Check for stored OAuth code from callback route
    const storedCode = sessionStorage.getItem('spotify_oauth_code');
    if (storedCode) {
      console.log('Found stored OAuth code:', storedCode);
      sessionStorage.removeItem('spotify_oauth_code');
      handleOAuthCallback(storedCode);
      return;
    }

    // Fallback: check URL params (in case callback goes directly to this page)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log('Found OAuth code in URL:', code);
      handleOAuthCallback(code);
      // Clear the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check if user is already authenticated on component mount
    checkAuthStatus();
  }, [socket]);

  const checkAuthStatus = async () => {
    try {
      // Try to get user's playlists to check if authenticated
      const response = await spotifyAPI.getPlaylists();
      if (response.data && response.data.items) {
        setIsAuthenticated(true);
        
        // Notify display app that Spotify is ready
        if (socket) {
          socket.emit('spotify-authenticated');
          console.log('Notified display app of existing Spotify authentication');
        }
        
        loadSpotifyData();
        getCurrentPlayback();
      }
    } catch (error) {
      // User not authenticated, that's fine
      console.log('User not authenticated yet');
    }
  };

  const handleOAuthCallback = async (code) => {
    try {
      console.log('Handling OAuth callback with code:', code);
      const response = await spotifyAPI.handleCallback(code);
      console.log('Callback response:', response);
      setIsAuthenticated(true);
      
      // Notify display app that Spotify is authenticated
      if (socket) {
        socket.emit('spotify-authenticated');
        console.log('Notified display app of Spotify authentication');
      }
      
      // Load playlists and devices
      loadSpotifyData();
      getCurrentPlayback();
    } catch (error) {
      console.error('OAuth callback failed:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const loadSpotifyData = async () => {
    try {
      const [playlistsRes, devicesRes] = await Promise.all([
        spotifyAPI.getPlaylists(),
        spotifyAPI.getDevices()
      ]);
      
      setPlaylists(playlistsRes.data.items || []);
      setDevices(devicesRes.data.devices || []);
    } catch (error) {
      console.error('Failed to load Spotify data:', error);
      // If we get auth errors, user might need to re-authenticate
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
      }
    }
  };

  const getCurrentPlayback = async () => {
    try {
      const response = await spotifyAPI.getCurrentPlayback();
      if (response.data && response.data.data) {
        const playbackData = response.data.data;
        setIsPlaying(playbackData.is_playing);
        setShuffleEnabled(playbackData.shuffle_state);
        setCurrentTrack(playbackData.item);

        // Send current track info to display app
        if (socket && playbackData.item) {
          const trackData = {
            name: playbackData.item.name,
            artists: playbackData.item.artists?.map(a => a.name).join(', ') || '',
            album: playbackData.item.album?.name || '',
            image: playbackData.item.album?.images?.[0]?.url || null,
            is_playing: playbackData.is_playing
          };
          
          console.log('Sending track data to display:', trackData);
          socket.emit('spotify-track-changed', trackData);
        }
      }
    } catch (error) {
      console.error('Failed to get current playback:', error);
    }
  };

  const authenticateSpotify = async () => {
    try {
      const response = await spotifyAPI.getLoginUrl();
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const playPlaylist = async (playlistUri) => {
    try {
      // Use direct API call to start playback on selected device
      await spotifyAPI.play(playlistUri, selectedDevice);
      setIsPlaying(true);
      
      // Also send WebSocket command to display for local controls
      if (socket) {
        socket.emit('spotify-play', { playlistUri, deviceId: selectedDevice });
      }
      
      // Refresh current playback info after a short delay
      setTimeout(() => getCurrentPlayback(), 1000);
    } catch (error) {
      console.error('Failed to play playlist:', error);
    }
  };

  const pausePlayback = async () => {
    try {
      console.log('Pausing playback, selectedDevice:', selectedDevice);
      // Use direct API call to pause
      await spotifyAPI.pause();
      setIsPlaying(false);
      
      // Also send WebSocket command to display
      if (socket) {
        socket.emit('spotify-pause');
      }
      
      // Update display with current state
      setTimeout(() => getCurrentPlayback(), 500);
    } catch (error) {
      console.error('Failed to pause playback:', error);
    }
  };

  const resumePlayback = async () => {
    try {
      console.log('Resuming playback, selectedDevice:', selectedDevice);
      // Resume playback without specifying a track/playlist
      await spotifyAPI.resume(selectedDevice);
      setIsPlaying(true);
      
      if (socket) {
        socket.emit('spotify-resume');
      }
      
      // Update display with current state
      setTimeout(() => getCurrentPlayback(), 500);
    } catch (error) {
      console.error('Failed to resume playback:', error);
    }
  };

  const toggleShuffle = async () => {
    try {
      const newShuffleState = !shuffleEnabled;
      await spotifyAPI.setShuffle(newShuffleState);
      setShuffleEnabled(newShuffleState);
      
      if (socket) {
        socket.emit('spotify-shuffle', { enabled: newShuffleState });
      }
    } catch (error) {
      console.error('Failed to toggle shuffle:', error);
    }
  };

  const skipNext = async () => {
    try {
      await spotifyAPI.skipNext();
      // Refresh current playback info after a short delay to get new track
      setTimeout(() => getCurrentPlayback(), 1000);
    } catch (error) {
      console.error('Failed to skip to next track:', error);
    }
  };

  const skipPrevious = async () => {
    try {
      await spotifyAPI.skipPrevious();
      // Refresh current playback info after a short delay to get new track
      setTimeout(() => getCurrentPlayback(), 1000);
    } catch (error) {
      console.error('Failed to skip to previous track:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-slate-800 p-6 rounded-lg border border-slate-700">
        <div className="text-center">
          <Music className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Session Music</h3>
          <p className="text-slate-400 mb-4">Connect your Spotify account to control music during your D&D sessions</p>
          <button
            onClick={authenticateSpotify}
            className="w-full bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Connect Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-800 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
        <Music className="w-5 h-5 mr-2 text-green-500" />
        Session Music
      </h3>

      {/* Device Selection */}
      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-2">Play on Device:</label>
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm"
        >
          <option value="">Select Device</option>
          {displayDeviceId && (
            <option value={displayDeviceId}>
              D&D Display Player (TV Audio)
            </option>
          )}
          {devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.name} {device.is_active ? '(Active)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Current Track Display */}
      {currentTrack && (
        <div className="mb-4 p-3 bg-slate-700 rounded">
          <p className="text-sm text-slate-300">Now Playing:</p>
          <p className="text-slate-100 font-medium truncate">{currentTrack.name}</p>
          <p className="text-slate-400 text-sm truncate">{currentTrack.artists?.map(a => a.name).join(', ')}</p>
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex gap-2 mb-4 flex-wrap w-full">
        {/* Previous Track */}
        <button
          onClick={skipPrevious}
          disabled={!selectedDevice || !currentTrack}
          className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-3 py-2 rounded transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Play/Pause - takes up more space */}
        {isPlaying ? (
          <button
            onClick={pausePlayback}
            disabled={!selectedDevice}
            className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2 rounded transition-colors flex-1 min-w-0"
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={resumePlayback}
            disabled={!selectedDevice}
            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded transition-colors flex-1 min-w-0"
          >
            <Play className="w-4 h-4" />
            <span>Resume</span>
          </button>
        )}

        {/* Next Track */}
        <button
          onClick={skipNext}
          disabled={!selectedDevice || !currentTrack}
          className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-3 py-2 rounded transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Secondary Controls Row */}
      <div className="flex gap-2 mb-4 w-full">
        {/* Shuffle Toggle */}
        <button
          onClick={toggleShuffle}
          disabled={!selectedDevice}
          className={`flex items-center justify-center space-x-2 px-3 py-2 rounded transition-colors flex-1 ${
            shuffleEnabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-slate-700 hover:bg-slate-600'
          } disabled:opacity-50`}
        >
          <Shuffle className="w-4 h-4" />
          <span>{shuffleEnabled ? 'Shuffle On' : 'Shuffle Off'}</span>
        </button>

        {/* Refresh */}
        <button
          onClick={() => {
            loadSpotifyData();
            getCurrentPlayback();
          }}
          className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded transition-colors flex-1"
        >
          <Smartphone className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Display Device Status */}
      {displayDeviceId && (
        <div className="mb-4 p-2 bg-green-900/20 border border-green-700 rounded text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-400">D&D Display Player ready</span>
          </div>
        </div>
      )}

      {/* Mood Playlists */}
      <div className="space-y-2 w-full">
        <p className="text-sm text-slate-300">Quick Playlists:</p>
        <div className="grid grid-cols-1 gap-2 w-full">
          {playlists.slice(0, 5).map(playlist => (
            <button
              key={playlist.id}
              onClick={() => playPlaylist(playlist.uri)}
              disabled={!selectedDevice}
              className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm transition-colors"
            >
              <span className="truncate block">{playlist.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpotifyControls;