import { useState, useEffect } from 'react';
import { Monitor, MonitorOff, Eye, EyeOff, Grid3X3, Search, Filter } from 'lucide-react';
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

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'creature', label: 'Creatures' },
    { value: 'location', label: 'Locations' },
    { value: 'npc', label: 'NPCs' },
    { value: 'map', label: 'Maps' }
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
    <div className="space-y-6">
      {/* Header & Display Status */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Display Controller</h2>
            <p className="text-slate-400">
              Campaign: {activeCampaign.name} • {filteredImages.length} images available
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-slate-400">
                {isSocketConnected ? 'Connected to display' : 'Disconnected from display'}
              </span>
            </div>
          </div>
        </div>

        {/* Spotify Controls */}
        <div className="lg:w-80">
          <SpotifyControls />
        </div>
      </div>

      {/* Current Display Status */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">Display Status</span>
          <div className={`flex items-center space-x-2 ${
            isDisplayActive ? 'text-emerald-400' : 'text-slate-400'
          }`}>
            {isDisplayActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isDisplayActive ? 'Active' : 'Hidden'}
            </span>
          </div>
        </div>

        {currentDisplayImage ? (
          <div className="flex items-center space-x-3">
            <img
              src={currentDisplayImage.cloudinaryUrl}
              alt={currentDisplayImage.name}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {currentDisplayImage.name}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {currentDisplayImage.category}
              </p>
            </div>
            <button
              onClick={hideDisplay}
              className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              <MonitorOff className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <MonitorOff className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No image displayed</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={hideDisplay}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
        >
          <MonitorOff className="w-4 h-4" />
          <span>Black Screen</span>
        </button>
        
        <button className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors">
          <Grid3X3 className="w-4 h-4" />
          <span>Grid View</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search campaign images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Campaign Images Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-slate-400">Loading campaign images...</div>
        </div>
      ) : filteredImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
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
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">
            {searchTerm || selectedCategory !== 'all' 
              ? 'No matching images' 
              : 'No images in campaign'
            }
          </h3>
          <p className="text-slate-400">
            {campaignImages.length === 0 
              ? 'Add some images to this campaign first'
              : 'Try adjusting your search or filters'
            }
          </p>
        </div>
      )}
    </div>
  );
};

const DisplayImageCard = ({ image, isCurrentlyDisplayed, onDisplay }) => {
  return (
    <div 
      className={`group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
        isCurrentlyDisplayed 
          ? 'border-emerald-500 ring-2 ring-emerald-500/50' 
          : 'border-slate-700 hover:border-amber-500'
      }`}
      onClick={onDisplay}
    >
      <img
        src={image.cloudinaryUrl}
        alt={image.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
      />
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="text-center text-white p-2">
          <Monitor className="w-6 h-6 mx-auto mb-1" />
          <p className="text-xs font-medium">Display</p>
        </div>
      </div>

      {/* Currently displayed indicator */}
      {isCurrentlyDisplayed && (
        <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
          <Eye className="w-3 h-3" />
        </div>
      )}

      {/* Image info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-xs font-medium truncate">{image.name}</p>
        <p className="text-slate-300 text-xs capitalize">{image.category}</p>
      </div>
    </div>
  );
};

export default DisplayController;