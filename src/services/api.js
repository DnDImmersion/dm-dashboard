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
  searchUnsplash: (query, perPage = 20) => 
    api.get('/images/search-unsplash', { params: { query, per_page: perPage } })
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
  pause: () => api.post('/spotify/pause')
};