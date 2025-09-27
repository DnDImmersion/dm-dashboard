import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { imageAPI, campaignAPI } from './services/api';
import { Dice6, Image, Users, Monitor, Loader2 } from 'lucide-react';
import ImageLibrary from './components/ImageLibrary/ImageLibrary';
import CampaignManager from './components/CampaignManager/CampaignManager';
import DisplayController from './components/DisplayController/DisplayController';

// Simple Spotify callback component
const SpotifyCallback = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Store the code in sessionStorage so SpotifyControls can pick it up
      sessionStorage.setItem('spotify_oauth_code', code);
      // Redirect to display page where SpotifyControls can handle it
      navigate('/display');
    } else {
      // No code, just go to display
      navigate('/display');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-lg">Connecting to Spotify...</p>
      </div>
    </div>
  );
};

// Main App wrapper with Router
function App() {
  return (
    <Router>
      <DashboardApp />
    </Router>
  );
}

// Dashboard component with routing logic
function DashboardApp() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [images, setImages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isServerStarting, setIsServerStarting] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Get current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/campaigns') return 'campaigns';
    if (path === '/display') return 'display';
    return 'library'; // default
  };

  const currentTab = getCurrentTab();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setError(null);
      setRetryAttempts(prev => prev + 1);
      
      // After 2 attempts, assume server is starting
      if (retryAttempts >= 2) {
        setIsServerStarting(true);
      }
      
      const [imagesResponse, campaignsResponse] = await Promise.all([
        imageAPI.getAll(),
        campaignAPI.getAll()
      ]);
      
      setImages(imagesResponse.data);
      setCampaigns(campaignsResponse.data);
      
      const active = campaignsResponse.data.find(c => c.isActive);
      setActiveCampaign(active);
      
      // Reset states on success
      setIsServerStarting(false);
      setRetryAttempts(0);
      setLoading(false); // Set loading to false on success
    } catch (error) {
      console.error('Failed to load data:', error);
      
      if (retryAttempts >= 2) {
        setError('Server is starting up (free tier cold start). This may take up to 30 seconds...');
        setIsServerStarting(true);
        
        // Auto-retry every 3 seconds when server is starting
        setTimeout(() => {
          if (retryAttempts < 10) { // Limit retries
            loadInitialData();
          } else {
            setError('Failed to connect to server after multiple attempts. Please check your connection and try again.');
            setIsServerStarting(false);
            setLoading(false); // Stop loading on final failure
          }
        }, 3000);
      } else {
        setError('Failed to connect to server. Retrying...');
        setTimeout(loadInitialData, 2000);
      }
    }
  };

  const refreshImages = async () => {
    try {
      const response = await imageAPI.getAll();
      setImages(response.data);
    } catch (error) {
      console.error('Failed to refresh images:', error);
    }
  };

  const tabConfig = [
    { id: 'library', label: 'Image Library', icon: Image, path: '/' },
    { id: 'campaigns', label: 'Campaigns', icon: Users, path: '/campaigns' },
    { id: 'display', label: 'Display Control', icon: Monitor, path: '/display' }
  ];

  const handleTabChange = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          
          {isServerStarting ? (
            <>
              <p className="text-lg">Starting Server...</p>
              <p className="text-sm text-slate-400 mt-2">Free tier cold start - this may take up to 30 seconds</p>
              <div className="mt-4 flex justify-center items-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  ></div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Attempt {retryAttempts}/10
              </p>
            </>
          ) : (
            <>
              <p className="text-lg">Loading DM Dashboard...</p>
              {retryAttempts > 0 && (
                <p className="text-sm text-yellow-400 mt-2">
                  Retrying connection... ({retryAttempts}/10)
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          {isServerStarting ? (
            <div className="text-amber-400">
              <div className="text-6xl mb-4">🔄</div>
              <h2 className="text-xl font-semibold mb-2">Server Starting...</h2>
              <p className="mb-4 text-slate-300">{error}</p>
              <div className="flex justify-center items-center space-x-1 mb-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  ></div>
                ))}
              </div>
              <p className="text-sm text-slate-400">
                Auto-retrying... ({retryAttempts}/10)
              </p>
            </div>
          ) : (
            <div className="text-red-400">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
              <p className="mb-4 text-slate-300">{error}</p>
              <button 
                onClick={() => {
                  setRetryAttempts(0);
                  setIsServerStarting(false);
                  setLoading(true);
                  loadInitialData();
                }}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Dice6 className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl font-bold text-amber-400">
              DM Immersion Dashboard
            </h1>
          </div>
          
          {activeCampaign && (
            <div className="bg-slate-700 px-4 py-2 rounded-lg border border-slate-600">
              <span className="text-sm text-slate-400">Active Campaign:</span>
              <span className="ml-2 font-semibold text-emerald-400">
                {activeCampaign.name}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabConfig.map(({ id, label, icon: Icon, path }) => (
              <button
                key={id}
                onClick={() => handleTabChange(path)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  currentTab === id
                    ? 'border-amber-400 text-amber-400 bg-slate-700'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content with Routes */}
      <main className="max-w-7xl mx-auto p-4">
        <Routes>
          <Route 
            path="/" 
            element={
              <ImageLibrary 
                images={images} 
                onImagesChange={refreshImages}
                activeCampaign={activeCampaign}
              />
            } 
          />
          <Route 
            path="/campaigns" 
            element={
              <CampaignManager 
                campaigns={campaigns}
                activeCampaign={activeCampaign}
                onCampaignsChange={loadInitialData}
              />
            } 
          />
          <Route 
            path="/display" 
            element={
              <DisplayController 
                activeCampaign={activeCampaign}
              />
            } 
          />
          {/* Spotify OAuth callback route */}
          <Route 
            path="/callback" 
            element={<SpotifyCallback />} 
          />
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;