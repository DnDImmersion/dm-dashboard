import { useState, useEffect } from 'react';
import { Play, Pause, Music, Smartphone } from 'lucide-react';
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

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    
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
    // Check if we're returning from Spotify OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code) => {
    try {
      await spotifyAPI.handleCallback(code);
      setIsAuthenticated(true);
      
      // Clear the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Load playlists and devices
      loadSpotifyData();
    } catch (error) {
      console.error('OAuth callback failed:', error);
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
    } catch (error) {
      console.error('Failed to play playlist:', error);
    }
  };

  const pausePlayback = async () => {
    try {
      // Use direct API call to pause
      await spotifyAPI.pause();
      setIsPlaying(false);
      
      // Also send WebSocket command to display
      if (socket) {
        socket.emit('spotify-pause');
      }
    } catch (error) {
      console.error('Failed to pause playback:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <div className="text-center">
          <Music className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Session Music</h3>
          <p className="text-slate-400 mb-4">Connect your Spotify account to control music during your D&D sessions</p>
          <button
            onClick={authenticateSpotify}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Connect Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
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

      {/* Playback Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={pausePlayback}
          disabled={!isPlaying}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-3 py-2 rounded transition-colors"
        >
          <Pause className="w-4 h-4" />
          <span>Pause</span>
        </button>

        <button
          onClick={() => loadSpotifyData()}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded transition-colors"
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
      <div className="space-y-2">
        <p className="text-sm text-slate-300">Quick Playlists:</p>
        <div className="grid grid-cols-1 gap-2">
          {playlists.slice(0, 5).map(playlist => (
            <button
              key={playlist.id}
              onClick={() => playPlaylist(playlist.uri)}
              disabled={!selectedDevice}
              className="text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm transition-colors"
            >
              {playlist.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpotifyControls;