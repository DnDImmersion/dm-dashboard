import { useState, useEffect } from 'react';
import { Monitor, MonitorOff, Eye, EyeOff, Grid3X3, Search, Filter, Music } from 'lucide-react';
import { campaignImageAPI, imageAPI } from '../../services/api';
import { io } from 'socket.io-client';
import SpotifyControls from '../SpotifyControls/SpotifyControls';

const DisplayController = ({ activeCampaign }) => {
  const [campaignImages, setCampaignImages] = useState([]);
  const [currentDisplayImage, setCurrentDisplayImage] = useState(null);
  const [isDisplayActive, setIsDisplayActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [showSpotifyControls, setShowSpotifyControls] = useState(true);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'creature', label: 'Creatures' },
    { value: 'location', label: 'Locations' },
    { value: 'npc', label: 'NPCs' },
    { value: 'map', label: 'Maps' },
    { value: 'item', label: 'Items' },
    { value: 'background', label: 'Background' }
  ];

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      setIsSocketConnected(true);
      console.log('Dashboard connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsSocketConnected(false);
      console.log('Dashboard disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (activeCampaign) {
      loadCampaignImages();
    }
  }, [activeCampaign]);

  const loadCampaignImages = async () => {
    setLoading(true);
    try {
      const response = await campaignImageAPI.getCampaignImages(activeCampaign._id);
      setCampaignImages(response.data);
    } catch (error) {
      console.error('Failed to load campaign images:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = campaignImages.filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const displayImage = (image) => {
    setCurrentDisplayImage(image);
    setIsDisplayActive(true);
    
    // Send to display via WebSocket
    if (socket && isSocketConnected) {
      socket.emit('display-image', image);
      console.log('Sent image to display:', image.name);
    } else {
      console.warn('Socket not connected - cannot send to display');
    }
  };

  const hideDisplay = () => {
    setCurrentDisplayImage(null);
    setIsDisplayActive(false);
    
    // Send hide command via WebSocket
    if (socket && isSocketConnected) {
      socket.emit('hide-display');
      console.log('Hiding display');
    } else {
      console.warn('Socket not connected - cannot hide display');
    }
  };

  if (!activeCampaign) {
    return (
      <div className="text-center py-12">
        <Monitor className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No Active Campaign</h3>
        <p className="text-slate-400">
          Activate a campaign to control the display
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-slate-100">Display Control</h2>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isSocketConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <span className="text-sm text-slate-400">•</span>
          <span className="text-sm text-slate-400">{filteredImages.length} images</span>
        </div>
        
        <button
          onClick={() => setShowSpotifyControls(!showSpotifyControls)}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors text-sm"
        >
          <Music className="w-4 h-4" />
          <span>{showSpotifyControls ? 'Hide' : 'Show'} Music</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Column - Images */}
        <div className={`${showSpotifyControls ? 'col-span-8' : 'col-span-12'} flex flex-col space-y-4 min-h-0`}>
          {/* Controls Row */}
          <div className="flex gap-4">
            {/* Current Display Status - Compact */}
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentDisplayImage ? (
                    <>
                      <img
                        src={currentDisplayImage.cloudinaryUrl}
                        alt={currentDisplayImage.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {currentDisplayImage.name}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          {currentDisplayImage.category}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MonitorOff className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-400">No image displayed</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 ${
                    isDisplayActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {isDisplayActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="text-xs font-medium">
                      {isDisplayActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  
                  <button
                    onClick={hideDisplay}
                    className="p-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors"
                    title="Hide Display"
                  >
                    <MonitorOff className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={hideDisplay}
                className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <MonitorOff className="w-4 h-4" />
                <span>Black Screen</span>
              </button>
              
              <button className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors text-sm">
                <Grid3X3 className="w-4 h-4" />
                <span>Grid</span>
              </button>
            </div>
          </div>

          {/* Search and Filter Row */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Images Grid - Takes remaining space */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-slate-400">Loading campaign images...</div>
              </div>
            ) : filteredImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {filteredImages.map(image => (
                  <DisplayImageCard
                    key={image._id}
                    image={image}
                    isCurrentlyDisplayed={currentDisplayImage?._id === image._id}
                    onDisplay={() => displayImage(image)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎭</div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-1">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'No matching images' 
                      : 'No images in campaign'
                    }
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {campaignImages.length === 0 
                      ? 'Add some images to this campaign first'
                      : 'Try adjusting your search or filters'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Spotify Controls */}
        {showSpotifyControls && (
          <div className="col-span-4 min-h-0">
            <SpotifyControls />
          </div>
        )}
      </div>
    </div>
  );
};

const DisplayImageCard = ({ image, isCurrentlyDisplayed, onDisplay }) => {
  return (
    <div 
      className={`group relative aspect-square rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
        isCurrentlyDisplayed 
          ? 'border-emerald-500 ring-2 ring-emerald-500/50' 
          : 'border-slate-700 hover:border-amber-500'
      }`}
      onClick={onDisplay}
      title={image.name}
    >
      <img
        src={image.cloudinaryUrl}
        alt={image.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
      />
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="text-center text-white">
          <Monitor className="w-4 h-4 mx-auto mb-1" />
          <p className="text-xs font-medium">Display</p>
        </div>
      </div>

      {/* Currently displayed indicator */}
      {isCurrentlyDisplayed && (
        <div className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full">
          <Eye className="w-2.5 h-2.5" />
        </div>
      )}

      {/* Image info - only show on hover for cleaner look */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-xs font-medium truncate">{image.name}</p>
        <p className="text-slate-300 text-xs capitalize">{image.category}</p>
      </div>
    </div>
  );
};

export default DisplayController;