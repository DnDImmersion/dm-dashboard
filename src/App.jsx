import { useState, useEffect } from 'react';
import { imageAPI, campaignAPI } from './services/api';
import { Dice6, Image, Users, Monitor, Loader2 } from 'lucide-react';
import ImageLibrary from './components/ImageLibrary/ImageLibrary';
import CampaignManager from './components/CampaignManager/CampaignManager';
import DisplayController from './components/DisplayController/DisplayController';

function App() {
  const [images, setImages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setError(null);
      const [imagesResponse, campaignsResponse] = await Promise.all([
        imageAPI.getAll(),
        campaignAPI.getAll()
      ]);
      
      setImages(imagesResponse.data);
      setCampaigns(campaignsResponse.data);
      
      const active = campaignsResponse.data.find(c => c.isActive);
      setActiveCampaign(active);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to connect to server. Make sure your backend is running.');
    } finally {
      setLoading(false);
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
    { id: 'library', label: 'Image Library', icon: Image },
    { id: 'campaigns', label: 'Campaigns', icon: Users },
    { id: 'display', label: 'Display Control', icon: Monitor }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading DM Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-red-400 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={loadInitialData}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
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
            {tabConfig.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === id
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {activeTab === 'library' && (
          <ImageLibrary 
            images={images} 
            onImagesChange={refreshImages}
            activeCampaign={activeCampaign}
          />
        )}
        {activeTab === 'campaigns' && (
          <CampaignManager 
            campaigns={campaigns}
            activeCampaign={activeCampaign}
            onCampaignsChange={loadInitialData}
          />
        )}
        {activeTab === 'display' && (
          <DisplayController 
            activeCampaign={activeCampaign}
          />
        )}
      </main>
    </div>
  );
}

export default App;