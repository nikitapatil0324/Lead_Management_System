import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Calendar, Mail, Phone, ExternalLink, MapPin, 
  UserCheck, History, Clock, FileText, Settings, ShieldAlert
} from 'lucide-react';
import LeadModal from '../components/LeadModal';

const LeadDetails = () => {
  const { id } = useParams();
  const { token, API_URL, user } = useAuth();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);

  const fetchLeadDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const leadRes = await fetch(`${API_URL}/leads/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leadData = await leadRes.json();
      if (!leadRes.ok) {
        throw new Error(leadData.error || 'Failed to fetch lead profile.');
      }
      setLead(leadData.lead);

      const logsRes = await fetch(`${API_URL}/logs/lead/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, API_URL, token]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading lead workspace profile...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <ShieldAlert size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '12px' }}>Profile Retrieval Failed</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'The requested lead record could not be loaded.'}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  let enrichment = null;
  if (lead.enrichment_data) {
    try {
      enrichment = typeof lead.enrichment_data === 'string' 
        ? JSON.parse(lead.enrichment_data) 
        : lead.enrichment_data;
    } catch (e) {
      console.error('Error parsing enrichment metadata:', e);
    }
  }

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
        
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          Update Lead Info
        </button>
      </div>

      <div className="lead-details-grid">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <span className={`badge badge-${lead.status}`} style={{ marginBottom: '12px' }}>
                  {lead.status.replace('_', ' ')}
                </span>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{lead.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <Calendar size={14} />
                  <span>Created {new Date(lead.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EMAIL ADDRESS</div>
                  <span style={{ fontWeight: '500' }}>{lead.email}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={16} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PHONE NUMBER</div>
                  <span style={{ fontWeight: '500' }}>{lead.phone || 'N/A'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ExternalLink size={16} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACQUISITION SOURCE</div>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{lead.source.replace('_', ' ')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <UserCheck size={18} style={{ color: 'var(--success)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ASSIGNED OWNER</div>
                  <span style={{ fontWeight: '600' }}>
                    {lead.assigned_to_name ? `${lead.assigned_to_name} (${lead.assigned_to_email})` : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            {lead.notes && (
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} />
                  <span>Conversation Notes</span>
                </h4>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {lead.notes}
                </p>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '120px', height: '120px', background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
            
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>External API Enrichment Data</span>
            </h3>

            {enrichment ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <img 
                    src={enrichment.avatar_url || enrichment.picture} 
                    alt="avatar" 
                    style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--accent-primary)', objectFit: 'cover' }} 
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {enrichment.job_title || 'Enterprise Contact'}
                    </div>
                    <div style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>
                      🏢 {enrichment.company || 'Enterprise Partner'}
                    </div>
                  </div>
                </div>

                <div className="enrichment-grid" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  
                  {enrichment.location && (
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={16} style={{ color: 'var(--danger)', marginTop: '2px' }} />
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ENRICHED GEOLOCATION</span>
                        <span>{enrichment.location.city}, {enrichment.location.state}, {enrichment.location.country}</span>
                      </div>
                    </div>
                  )}

                  {enrichment.gender && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>GENDER</span>
                      <span style={{ textTransform: 'capitalize' }}>{enrichment.gender}</span>
                    </div>
                  )}

                  {enrichment.nationality && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>NATIONALITY</span>
                      <span>{enrichment.nationality}</span>
                    </div>
                  )}
                  
                  <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Enriched via RandomUser API</span>
                    <span>Synced: {new Date(enrichment.enriched_at).toLocaleDateString()}</span>
                  </div>

                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                <p>No enrichment metadata synchronized for this lead contact profile.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} style={{ color: 'var(--accent-secondary)' }} />
            <span>Lead Activity Log & Audit Trail</span>
          </h3>

          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <p>No activity logs recorded for this lead profile.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', paddingLeft: '24px' }}>
              
              <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'var(--border-color)' }}></div>
              
              {logs.map((log) => {
                let badgeClass = 'badge-new';
                if (log.activity_type === 'updated') badgeClass = 'badge-qualified';
                if (log.activity_type === 'assigned') badgeClass = 'badge-contacted';
                if (log.activity_type === 'status_changed') badgeClass = 'badge-won';

                return (
                  <div key={log.id} style={{ position: 'relative' }}>
                    
                    <div style={{ position: 'absolute', left: '-24px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-primary)', border: '3px solid var(--accent-primary)', zIndex: 2 }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {log.activity_type.replace('_', ' ')}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {log.details}
                    </p>
                    
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Triggered by: <span style={{ fontWeight: '600' }}>{log.user_name || 'System Automation'}</span> 
                      {log.user_role && ` (${log.user_role})`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <LeadModal
        lead={lead}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchLeadDetails}
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

export default LeadDetails;
