import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LeadModal from '../components/LeadModal';
import { 
  Search, Plus, Eye, Edit2, Trash2, ArrowUpDown, 
  ChevronLeft, ChevronRight, BarChart2, Briefcase, 
  Clock, CheckCircle, TrendingUp, AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user, token, API_URL } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, qualified: 0, won: 0, lost: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const statsRes = await fetch(`${API_URL}/leads/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        sortField,
        sortOrder
      });
      if (statusFilter) queryParams.append('status', statusFilter);
      if (sourceFilter) queryParams.append('source', sourceFilter);

      const leadsRes = await fetch(`${API_URL}/leads?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leadsData = await leadsRes.json();
      if (!leadsRes.ok) {
        throw new Error(leadsData.error || 'Failed to fetch lead list.');
      }
      
      setLeads(leadsData.leads);
      setPagination(leadsData.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, pagination.page, pagination.limit, search, statusFilter, sourceFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (type, value) => {
    if (type === 'status') setStatusFilter(value);
    if (type === 'source') setSourceFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'ASC';
    setSortField(field);
    setSortOrder(isAsc ? 'DESC' : 'ASC');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleCreateClick = () => {
    setSelectedLead(null);
    setModalOpen(true);
  };

  const handleEditClick = (lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  const handleDeleteClick = async (leadId, leadName) => {
    if (window.confirm(`Are you sure you want to permanently delete lead: "${leadName}"?`)) {
      try {
        const response = await fetch(`${API_URL}/leads/${leadId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete lead.');
        }
        fetchDashboardData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const isManagerOrAdmin = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      
      <div className="analytics-grid">
        <div className="stat-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>TOTAL SYSTEM LEADS</span>
            <BarChart2 size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="stat-num">{stats.total || 0}</div>
        </div>
        <div className="stat-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>NEW PROSPECTS</span>
            <Clock size={20} style={{ color: 'var(--info)' }} />
          </div>
          <div className="stat-num">{stats.new || 0}</div>
        </div>
        <div className="stat-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>QUALIFIED PIPELINE</span>
            <Briefcase size={20} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div className="stat-num">{stats.qualified || 0}</div>
        </div>
        <div className="stat-card glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>CLOSED WON</span>
            <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-num">{stats.won || 0}</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '28px' }}>
        
        <div className="toolbar-container">
          
          <div className="toolbar-controls">
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name, email, phone or notes..."
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%', paddingTop: '10px', paddingBottom: '10px' }}
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            <select
              className="form-control form-select"
              style={{ width: '150px', paddingTop: '10px', paddingBottom: '10px' }}
              value={statusFilter}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              className="form-control form-select"
              style={{ width: '150px', paddingTop: '10px', paddingBottom: '10px' }}
              value={sourceFilter}
              onChange={e => handleFilterChange('source', e.target.value)}
            >
              <option value="">All Sources</option>
              <option value="web">Web Portal</option>
              <option value="email">Email Campaign</option>
              <option value="referral">Client Referral</option>
              <option value="cold_call">Cold Calling</option>
              <option value="social">Social Media</option>
              <option value="other">Other</option>
            </select>
          </div>

          {isManagerOrAdmin && (
            <button className="btn btn-primary" onClick={handleCreateClick} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              <span>Create Lead</span>
            </button>
          )}
        </div>

        {error && (
          <div className="alert-banner alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="table-container">
          {loading ? (
            <div className="flex-center" style={{ height: '300px', flexDirection: 'column', gap: '12px' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading lead records...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex-center" style={{ height: '300px', flexDirection: 'column', color: 'var(--text-secondary)', gap: '8px' }}>
              <TrendingUp size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>No leads matching search filters</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Try adjusting search term or dropdown selections.</p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ width: '22%' }}>
                    Name <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th style={{ width: '25%' }}>Contact Info</th>
                  <th onClick={() => handleSort('status')} style={{ width: '13%' }}>
                    Status <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th onClick={() => handleSort('source')} style={{ width: '12%' }}>
                    Source <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th style={{ width: '15%' }}>Assigned Agent</th>
                  <th onClick={() => handleSort('created_at')} style={{ width: '13%' }}>
                    Created <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th style={{ textAlign: 'right', width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: '700' }} data-label="Name">{lead.name}</td>
                    <td data-label="Contact Info">
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{lead.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lead.phone || 'No phone'}</div>
                    </td>
                    <td data-label="Status">
                      <span className={`badge badge-${lead.status}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td data-label="Source">
                      <span style={{ fontSize: '0.85rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        {lead.source.replace('_', ' ')}
                      </span>
                    </td>
                    <td data-label="Assigned Agent">
                      {lead.assigned_to_name ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{lead.assigned_to_name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assigned Owner</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} data-label="Created">
                      {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          title="View lead details and audit logs"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          onClick={() => handleEditClick(lead)}
                          title="Edit lead status and notes"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        {isManagerOrAdmin && (
                          <button 
                            className="btn btn-secondary btn-icon" 
                            style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleDeleteClick(lead.id, lead.name)}
                            title="Delete lead record"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Showing {leads.length} of {pagination.totalItems} leads
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <LeadModal
        lead={selectedLead}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchDashboardData}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
