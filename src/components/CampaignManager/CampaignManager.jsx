import { useState } from 'react';
import { Plus, Settings, Play, Pause, Trash2, Users, Calendar, Edit3 } from 'lucide-react';
import { campaignAPI } from '../../services/api';

const CampaignManager = ({ campaigns, activeCampaign, onCampaignsChange }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const activateCampaign = async (campaignId) => {
    try {
      await campaignAPI.activate(campaignId);
      onCampaignsChange();
    } catch (error) {
      console.error('Failed to activate campaign:', error);
      alert('Failed to activate campaign');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Campaign Manager</h2>
          <p className="text-slate-400">
            {campaigns.length} campaigns • {activeCampaign ? `${activeCampaign.name} is active` : 'No active campaign'}
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(campaign => (
          <CampaignCard
            key={campaign._id}
            campaign={campaign}
            isActive={activeCampaign?._id === campaign._id}
            onActivate={() => activateCampaign(campaign._id)}
            onEdit={() => setEditingCampaign(campaign)}
          />
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏰</div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No campaigns yet</h3>
          <p className="text-slate-400 mb-6">Create your first campaign to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg transition-colors"
          >
            Create First Campaign
          </button>
        </div>
      )}

      {/* Create/Edit Campaign Modal */}
      {(showCreateModal || editingCampaign) && (
        <CampaignModal
          campaign={editingCampaign}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCampaign(null);
          }}
          onSave={onCampaignsChange}
        />
      )}
    </div>
  );
};

const CampaignCard = ({ campaign, isActive, onActivate, onEdit }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-slate-800 rounded-lg border-2 p-6 transition-all ${
      isActive 
        ? 'border-emerald-500 ring-2 ring-emerald-500/50' 
        : 'border-slate-700 hover:border-slate-500'
    }`}>
      {/* Campaign Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-100 mb-1">
            {campaign.name}
          </h3>
          {isActive && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
              <Play className="w-3 h-3 mr-1" />
              Active
            </span>
          )}
        </div>
        
        <button
          onClick={onEdit}
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Campaign Description */}
      {campaign.description && (
        <p className="text-slate-400 text-sm mb-4 line-clamp-3">
          {campaign.description}
        </p>
      )}

      {/* Campaign Meta */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-slate-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Created {formatDate(campaign.createdAt)}</span>
        </div>
        <div className="flex items-center text-sm text-slate-400">
          <Users className="w-4 h-4 mr-2" />
          <span>Last updated {formatDate(campaign.updatedAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isActive ? (
          <button
            onClick={onActivate}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Activate
          </button>
        ) : (
          <div className="flex-1 bg-emerald-500/20 px-3 py-2 rounded text-sm font-medium text-emerald-400 text-center">
            Current Campaign
          </div>
        )}
        
        <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const CampaignModal = ({ campaign, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    isActive: campaign?.isActive || false
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (campaign) {
        // Update existing campaign (you'd need to add an update API endpoint)
        alert('Campaign update not implemented yet');
      } else {
        // Create new campaign
        await campaignAPI.create(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save campaign:', error);
      alert('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-slate-100 mb-4">
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter campaign name..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                placeholder="Optional campaign description..."
              />
            </div>

            {!campaign && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-slate-300">
                  Set as active campaign
                </label>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim() || saving}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : (campaign ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CampaignManager;