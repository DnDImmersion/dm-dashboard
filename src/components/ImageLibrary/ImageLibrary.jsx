import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Upload, Eye, Trash2, Grid3X3, List, ChevronLeft, ChevronRight, ArrowLeft, Edit } from 'lucide-react';
import { imageAPI, campaignImageAPI } from '../../services/api';
import ImageNamingModal from './ImageNamingModal';
import LocalImageUpload from './LocalImageUpload';

const ImageLibrary = ({ images, onImagesChange, activeCampaign }) => {
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const [showSearchView, setShowSearchView] = useState(false);
  const [showLocalUpload, setShowLocalUpload] = useState(false);

  const categories = [
    { value: 'all', label: 'All Images' },
    { value: 'creature', label: 'Creatures' },
    { value: 'location', label: 'Locations' },
    { value: 'npc', label: 'NPCs' },
    { value: 'item', label: 'Items' },
    { value: 'map', label: 'Maps' },
    { value: 'background', label: 'Background' }
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

  if (showSearchView) {
    return (
      <ImageSearchView 
        onBack={() => setShowSearchView(false)}
        onImagesAdded={() => {
          onImagesChange();
          setShowSearchView(false);
        }}
      />
    );
  }

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
            onClick={() => setShowLocalUpload(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
          
          <button
            onClick={() => setShowSearchView(true)}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Search & Add</span>
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

      {/* Local Image Upload Modal */}
      <LocalImageUpload
        isOpen={showLocalUpload}
        onClose={() => setShowLocalUpload(false)}
        onUploadSuccess={onImagesChange}
      />
    </div>
  );
};

const ImageSearchView = ({ onBack, onImagesAdded }) => {
  const [activeTab, setActiveTab] = useState('pixabay');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [imageType, setImageType] = useState('illustration');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  // Modal state
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [selectedImageForNaming, setSelectedImageForNaming] = useState(null);

  const handlePixabaySearch = async (e, page = 1) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setCurrentPage(page);
    
    try {
      const response = await imageAPI.searchPixabay(searchQuery, imageType, 20, page);
      setSearchResults(response.data.images);
      setTotalResults(response.data.total);
      setTotalPages(response.data.totalPages);
      
      if (page === 1) {
        setSelectedImages(new Set());
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsplashSearch = async (e, page = 1) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setCurrentPage(page);
    
    try {
      const response = await imageAPI.searchUnsplash(searchQuery, 20, page);
      setSearchResults(response.data.results);
      setTotalResults(response.data.total);
      setTotalPages(response.data.totalPages);
      
      if (page === 1) {
        setSelectedImages(new Set());
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e, page = 1) => {
    if (activeTab === 'pixabay') {
      handlePixabaySearch(e, page);
    } else {
      handleUnsplashSearch(e, page);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      handleSearch(null, page);
    }
  };

  const toggleImageSelection = (imageId) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  // Handle single image save from modal
  const handleSingleImageSave = async (imageData) => {
    try {
      // Use the new upload-from-url endpoint
      const uploadData = {
        imageUrl: activeTab === 'pixabay' ? imageData.cloudinaryUrl : imageData.cloudinaryUrl,
        name: imageData.name,
        category: imageData.category,
        tags: imageData.tags
      };
      
      await imageAPI.uploadFromUrl(uploadData);
      setSelectedImages(new Set());
      alert('Image uploaded and added to your library!');
      onImagesAdded();
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    }
  };

  // Remove the bulk add function - always require modal
  const addSelectedToLibrary = async () => {
    const imagesToAdd = searchResults.filter(img => selectedImages.has(img.id));
    
    // Always require modal for category selection
    if (imagesToAdd.length === 1) {
      setSelectedImageForNaming(imagesToAdd[0]);
      setShowNamingModal(true);
      return;
    }
    
    // For multiple images, show message that they need to add one at a time
    alert('Please select one image at a time to customize and add to your library. This ensures proper categorization.');
    setSelectedImages(new Set());
  };

  const renderPaginationControls = () => {
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        {/* Previous button */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="flex items-center px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </button>

        {/* First page + ellipsis if needed */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="text-slate-400">...</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Last page + ellipsis if needed */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
            <button
              onClick={() => goToPage(totalPages)}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next button */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="flex items-center px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-100">Search Images</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('pixabay')}
          className={`px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'pixabay'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Fantasy Art (Pixabay)
        </button>
        <button
          onClick={() => setActiveTab('unsplash')}
          className={`px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'unsplash'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Photos (Unsplash)
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'pixabay' 
              ? "Search for fantasy art... (e.g., 'dragon', 'wizard', 'castle')"
              : "Search for images... (e.g., 'fantasy forest', 'medieval', 'tavern')"
            }
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
          />
          {activeTab === 'pixabay' && (
            <select
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
            >
              <option value="illustration">Illustrations</option>
              <option value="vector">Vectors</option>
              <option value="photo">Photos</option>
            </select>
          )}
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(activeTab === 'pixabay' 
            ? ['dragon', 'wizard', 'castle', 'fantasy landscape', 'dungeon', 'knight', 'monster', 'tavern']
            : ['fantasy forest', 'medieval tavern', 'castle', 'dungeon', 'village', 'mountains']
          ).map(suggestion => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setSearchQuery(suggestion)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-sm text-slate-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>

      {/* Attribution Notice for Pixabay */}
      {activeTab === 'pixabay' && searchResults.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
          <p className="text-blue-300 text-sm">
            Images provided by <strong>Pixabay</strong> - Free for commercial use, no attribution required for end use.
          </p>
        </div>
      )}

      {/* Results Header */}
      {searchResults.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-slate-300">
            Page {currentPage} of {totalPages} • {totalResults.toLocaleString()} total results • {selectedImages.size} selected
          </p>
          {selectedImages.size > 0 && (
            <button
              onClick={addSelectedToLibrary}
              className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {selectedImages.size === 1 ? 'Customize & Add' : `Customize ${selectedImages.size} Images`}
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-slate-400 mt-2">Searching...</p>
        </div>
      )}

      {/* Image Grid */}
      {!isLoading && searchResults.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {searchResults.map((image) => (
              <div
                key={image.id}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImages.has(image.id)
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => toggleImageSelection(image.id)}
              >
                <img
                  src={activeTab === 'pixabay' ? image.previewURL : image.thumbnail}
                  alt={activeTab === 'pixabay' ? image.tags : image.description}
                  className="w-full h-32 object-cover"
                />
                
                {/* Selection Indicator */}
                <div className="absolute top-2 left-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedImages.has(image.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-black/50 border-white'
                  }`}>
                    {selectedImages.has(image.id) && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                </div>

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    {activeTab === 'pixabay' ? image.tags : image.description}
                  </p>
                  <p className="text-gray-300 text-xs">
                    {activeTab === 'pixabay' 
                      ? `via Pixabay • ${image.views} views`
                      : `by ${image.photographer}`
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && renderPaginationControls()}
        </>
      )}

      {/* No Results */}
      {!isLoading && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-slate-400">No images found for "{searchQuery}"</p>
          <p className="text-slate-500 text-sm mt-1">Try different keywords</p>
        </div>
      )}

      {/* Image Naming Modal */}
      <ImageNamingModal
        isOpen={showNamingModal}
        onClose={() => setShowNamingModal(false)}
        image={selectedImageForNaming}
        activeTab={activeTab}
        onSave={handleSingleImageSave}
      />
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