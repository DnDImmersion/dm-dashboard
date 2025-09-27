import { useState } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';

const ImageNamingModal = ({ isOpen, onClose, image, activeTab, onSave }) => {
  const [name, setName] = useState(
    activeTab === 'pixabay' ? (image?.tags || 'Fantasy Art') : (image?.description || 'Untitled')
  );
  const [category, setCategory] = useState(activeTab === 'pixabay' ? 'fantasy' : 'creature');
  const [tags, setTags] = useState(
    activeTab === 'pixabay' 
      ? ['pixabay', ...image?.tags?.split(', ').slice(0, 3) || []]
      : ['unsplash']
  );
  const [customTag, setCustomTag] = useState('');

  const categories = [
    { value: 'creature', label: 'Creature' },
    { value: 'location', label: 'Location' },
    { value: 'npc', label: 'NPC' },
    { value: 'item', label: 'Item' },
    { value: 'map', label: 'Map' },
    { value: 'background', label: 'Background' }
  ];

  const addTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim().toLowerCase())) {
      setTags([...tags, customTag.trim().toLowerCase()]);
      setCustomTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    const imageData = {
      cloudinaryUrl: activeTab === 'pixabay' ? image.largeImageURL : image.url,
      cloudinaryId: `${activeTab}_${image.id}`,
      name: name.trim(),
      category,
      tags: tags.filter(tag => tag.trim())
    };
    
    onSave(imageData);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Customize Image Details
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Preview */}
          <div className="flex gap-4">
            <img
              src={activeTab === 'pixabay' ? image?.previewURL : image?.thumbnail}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-lg border border-slate-600"
            />
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Source</p>
              <p className="text-slate-200 capitalize font-medium">
                {activeTab} • {activeTab === 'pixabay' ? 'Fantasy Art' : 'Photography'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === 'pixabay' 
                  ? `${image?.views} views • ${image?.downloads} downloads`
                  : `by ${image?.photographer}`
                }
              </p>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Image Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a descriptive name..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags
            </label>
            
            {/* Current Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-600 text-slate-200 text-sm rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-slate-400 hover:text-slate-200 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add New Tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                onClick={addTag}
                disabled={!customTag.trim()}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-200 transition-colors"
              >
                Add
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mt-2">
              Press Enter or click Add to include the tag
            </p>
          </div>

          {/* Quick Tag Suggestions */}
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">Quick Tags</p>
            <div className="flex flex-wrap gap-2">
              {['medieval', 'fantasy', 'dungeon', 'outdoor', 'indoor', 'battle', 'magic', 'portrait'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {
                    if (!tags.includes(suggestion)) {
                      setTags([...tags, suggestion]);
                    }
                  }}
                  disabled={tags.includes(suggestion)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm text-slate-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            <Save className="w-4 h-4" />
            Save to Library
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageNamingModal;