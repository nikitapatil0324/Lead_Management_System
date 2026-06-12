import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Save, AlertCircle } from 'lucide-react';

const LeadModal = ({ lead, isOpen, onClose, onSave }) => {
  const { user, token, API_URL } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'web',
    status: 'new',
    assigned_to: '',
    notes: ''
  });
  
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || 'web',
        status: lead.status || 'new',
        assigned_to: lead.assigned_to || '',
        notes: lead.notes || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: 'web',
        status: 'new',
        assigned_to: '',
        notes: ''
      });
    }
    setError('');
  }, [lead, isOpen]);

  // Fetch agents list for assignment dropdown (only for Manager / Admin)
  useEffect(() => {
    if (isOpen && (user.role === 'admin' || user.role === 'manager')) {
      const fetchAgents = async () => {
        try {
          const response = await fetch(`${API_URL}/auth/agents`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setAgents(data.agents);
          }
        } catch (err) {
          console.error('Error fetching agents:', err);
        }
      };
      fetchAgents();
    }
  }, [isOpen, user, token]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError('Name and Email are required.');
      return;
    }
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = lead ? `${API_URL}/leads/${lead.id}` : `${API_URL}/leads`;
      const method = lead ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      
      // If editing existing lead and status changed, we preserve details
      // Clean up assigned_to: if empty, send null
      if (payload.assigned_to === '') {
        payload.assigned_to = null;
      } else {
        payload.assigned_to = parseInt(payload.assigned_to);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save lead.');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAgent = user.role === 'agent';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card animate-fade-in" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>{lead ? 'Update Lead Details' : 'Create New Prospect Lead'}</h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="alert-banner alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Form Fields for Managers/Admins */}
          <div className="form-group">
            <label className="form-label">Contact Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              disabled={isAgent || loading}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="modal-form-grid">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                disabled={isAgent || loading}
                placeholder="john@company.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                disabled={isAgent || loading}
                placeholder="e.g. +1 555-0199"
              />
            </div>
          </div>

          <div className="modal-form-grid">
            <div className="form-group">
              <label className="form-label">Acquisition Source</label>
              <select
                name="source"
                className="form-control form-select"
                value={formData.source}
                onChange={handleChange}
                disabled={isAgent || loading}
              >
                <option value="web">Web Portal</option>
                <option value="email">Email Campaign</option>
                <option value="referral">Client Referral</option>
                <option value="cold_call">Cold Calling</option>
                <option value="social">Social Media</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lead Status</label>
              <select
                name="status"
                className="form-control form-select"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                {isAgent ? (
                  <>
                    {formData.status !== 'in_progress' && formData.status !== 'completed' && (
                      <option value={formData.status} style={{ textTransform: 'capitalize' }}>
                        {formData.status.replace('_', ' ')}
                      </option>
                    )}
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </>
                ) : (
                  <>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Assigned Agent dropdown - Manager/Admin only */}
          {!isAgent && (
            <div className="form-group">
              <label className="form-label">Assign Agent Owner</label>
              <select
                name="assigned_to"
                className="form-control form-select"
                value={formData.assigned_to}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">-- Auto-Assign (Least-loaded Agent) --</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Conversation Notes</label>
            <textarea
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleChange}
              disabled={loading}
              placeholder="Add summary notes regarding customer interactions..."
              rows={4}
              style={{ resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>Syncing...</>
              ) : (
                <>
                  <Save size={15} />
                  <span>{lead ? 'Update Lead' : 'Create Lead'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadModal;
