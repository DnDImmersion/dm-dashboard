import { useState, useRef } from 'react';
import { Upload, X, Image, Save } from 'lucide-react';
import { imageAPI } from '../../services/api';

const LocalImageUpload = ({ isOpen, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('creature');
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    { value: 'creature', label: 'Creature' },
    { value: 'location', label: 'Location' },
    { value: 'npc', label: 'NPC' },
    { value: 'item', label: 'Item' },
    { value: 'map', label: 'Map' },
    { value: 'background', label: 'Background' }
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Auto-fill name from filename
      if (!name) {
        const fileName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setName(fileName);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
      const fakeEvent = { target: { files: [file] } };
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const addTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim().toLowerCase())) {
      setTags([...tags, customTag.trim().toLowerCase()]);
      setCustomTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !name.trim()) {
      alert('Please select a file and enter a name');
      return;
    }

    setIsUploading(true);
    try {
      const imageData = {
        name: name.trim(),
        category,
        tags: tags.filter(tag => tag.trim())
      };

      await imageAPI.uploadImage(selectedFile, imageData);
      
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setName('');
      setCategory('creature');
      setTags([]);
      setCustomTag('');
      
      alert('Image uploaded successfully!');
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Local Image
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Drop Zone */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Image File
            </label>
            
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 mb-2">
                  Click to select or drag and drop an image
                </p>
                <p className="text-slate-500 text-sm">
                  Supports: JPEG, PNG, GIF, WebP (Max 10MB)
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-slate-600 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded border border-slate-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-slate-400 text-sm">
                      {selectedFile.type}
                    </p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Image Name */}
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
              {['homebrew', 'custom', 'original', 'commissioned', 'high-res', 'token', 'portrait', 'environment'].map(suggestion => (
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
            onClick={handleUpload}
            disabled={!selectedFile || !name.trim() || isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Upload to Library
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalImageUpload;