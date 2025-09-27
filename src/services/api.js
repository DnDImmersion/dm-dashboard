import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const imageAPI = {
  getAll: (params = {}) => api.get('/images', { params }),
  create: (data) => api.post('/images', data),
  delete: (id) => api.delete(`/images/${id}`),
  importFromCloudinary: (data) => api.post('/images/import-from-cloudinary', data),
  searchPixabay: (query, imageType = 'illustration', perPage = 20, page = 1) => 
    api.get('/images/search-pixabay', { params: { query, image_type: imageType, per_page: perPage, page } }),
  searchUnsplash: (query, perPage = 20, page = 1) => 
    api.get('/images/search-unsplash', { params: { query, per_page: perPage, page } }),
  
  // NEW UPLOAD METHODS
  // Upload image file to Cloudinary via server
  uploadImage: (imageFile, imageData) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', imageData.name);
    formData.append('category', imageData.category);
    formData.append('tags', Array.isArray(imageData.tags) ? imageData.tags.join(',') : imageData.tags);

    return api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload image from URL (for Pixabay/Unsplash)
  uploadFromUrl: (imageData) => {
    return api.post('/images/upload-from-url', imageData);
  },

  // Bulk upload from URLs
  uploadBulkFromUrls: (imagesArray) => {
    return api.post('/images/upload-bulk-from-urls', { images: imagesArray });
  }
};

export const campaignAPI = {
  getAll: () => api.get('/campaigns'),
  create: (data) => api.post('/campaigns', data),
  activate: (id) => api.put(`/campaigns/${id}/activate`)
};

export const campaignImageAPI = {
  getCampaignImages: (campaignId) => api.get(`/campaign-images/${campaignId}/images`),
  addToCampaign: (campaignId, imageId) =>
    api.post(`/campaign-images/${campaignId}/images`, { imageId }),
  bulkAddToCampaign: (campaignId, imageIds) =>
    api.post(`/campaign-images/${campaignId}/images/bulk`, { imageIds })
};

export const spotifyAPI = {
  getLoginUrl: () => api.get('/spotify/login'),
  handleCallback: (code) => api.post('/spotify/callback', { code }),
  getPlaylists: () => api.get('/spotify/playlists'),
  getDevices: () => api.get('/spotify/devices'),
  play: (playlistUri, deviceId) => api.post('/spotify/play', { playlistUri, deviceId }),
  pause: () => api.post('/spotify/pause'),
  resume: (deviceId = null) => api.post('/spotify/resume', { deviceId }),
  setShuffle: (state) => api.put('/spotify/shuffle', { state }),
  getCurrentPlayback: () => api.get('/spotify/current-playback'),
  skipNext: () => api.post('/spotify/next'),
  skipPrevious: () => api.post('/spotify/previous')
};