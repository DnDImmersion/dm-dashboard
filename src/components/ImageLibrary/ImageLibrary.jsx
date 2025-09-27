import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Upload, Eye, Trash2, Grid3X3, List } from 'lucide-react';
import { imageAPI, campaignImageAPI } from '../../services/api';

const ImageLibrary = ({ images, onImagesChange, activeCampaign }) => {
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = [
    { value: 'all', label: 'All Images' },
    { value: 'creature', label: 'Creatures' },
    { value: 'location', label: 'Locations' },
    { value: 'npc', label: 'NPCs' },
    { value: 'map', label: 'Maps' },
    { value: 'item', label: 'Items' }
  ];

  useEffect(() => {
    filterImages();
  }, [images, searchTerm, selectedCategory]);

  const filterImages = () => {
    let filtered = images;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(img => img.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredImages(filtered);
  };

  const toggleImageSelection = (imageId) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const addSelectedToCampaign = async () => {
    if (!activeCampaign || selectedImages.size === 0) return;

    try {
      await campaignImageAPI.bulkAddToCampaign(
        activeCampaign._id, 
        Array.from(selectedImages)
      );
      setSelectedImages(new Set());
      alert(`Added ${selectedImages.size} images to ${activeCampaign.name}`);
    } catch (error) {
      console.error('Failed to add images to campaign:', error);
      alert('Failed to add images to campaign');
    }
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return;
    
    if (!confirm(`Delete ${selectedImages.size} selected images?`)) return;

    try {
      await Promise.all(
        Array.from(selectedImages).map(id => imageAPI.delete(id))
      );
      setSelectedImages(new Set());
      onImagesChange();
    } catch (error) {
      console.error('Failed to delete images:', error);
      alert('Failed to delete images');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Image Library</h2>
          <p className="text-slate-400">
            {filteredImages.length} images {selectedImages.size > 0 && `(${selectedImages.size} selected)`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Images</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search images by name or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

      {/* Bulk Actions */}
      {selectedImages.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-slate-800 rounded-lg border border-slate-600">
          <span className="text-sm text-slate-300">
            {selectedImages.size} selected
          </span>
          
          {activeCampaign && (
            <button
              onClick={addSelectedToCampaign}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-sm transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add to {activeCampaign.name}</span>
            </button>
          )}
          
          <button
            onClick={deleteSelectedImages}
            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
          
          <button
            onClick={() => setSelectedImages(new Set())}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Image Grid */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
        : "space-y-2"
      }>
        {filteredImages.map(image => (
          <ImageCard
            key={image._id}
            image={image}
            isSelected={selectedImages.has(image._id)}
            onToggleSelect={() => toggleImageSelection(image._id)}
            viewMode={viewMode}
          />
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎲</div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No images found</h3>
          <p className="text-slate-400">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Add some images to get started'
            }
          </p>
        </div>
      )}
    </div>
  );
};

const ImageCard = ({ image, isSelected, onToggleSelect, viewMode }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (viewMode === 'list') {
    return (
      <div className={`flex items-center space-x-4 p-3 rounded-lg border transition-colors ${
        isSelected 
          ? 'bg-amber-500/20 border-amber-500' 
          : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
      }`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
        />
        
        <img
          src={image.cloudinaryUrl}
          alt={image.name}
          className="w-12 h-12 object-cover rounded"
          onLoad={() => setImageLoaded(true)}
        />
        
        <div className="flex-1">
          <h4 className="font-medium text-slate-200">{image.name}</h4>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="capitalize">{image.category}</span>
            {image.tags.length > 0 && (
              <span>• {image.tags.join(', ')}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
      isSelected 
        ? 'border-amber-500 ring-2 ring-amber-500/50' 
        : 'border-slate-700 hover:border-slate-500'
    }`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="absolute top-2 left-2 z-10 w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
      />
      
      <img
        src={image.cloudinaryUrl}
        alt={image.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        onLoad={() => setImageLoaded(true)}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 left-2 right-2">
          <h4 className="font-medium text-white text-sm truncate">{image.name}</h4>
          <p className="text-xs text-slate-300 capitalize">{image.category}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageLibrary;