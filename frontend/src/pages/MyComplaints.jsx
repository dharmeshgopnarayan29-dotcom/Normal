import React, { useState, useMemo, useCallback, useContext } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { FileText, MapPin, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import ProgressTimeline, { MiniTimeline } from '../components/ProgressTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import { getMediaUrl } from '../api';
import { useMyComplaints, useDeleteMyComplaint } from '../hooks/useMyComplaints';

const getTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

const MyComplaints = () => {
    const { user } = useContext(AuthContext);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // ── React Query ──
    const { data: issues = [], isLoading } = useMyComplaints();
    const deleteMutation = useDeleteMyComplaint();

    // ── Derived filtered list (memoized) ──
    const filteredIssues = useMemo(
        () => filter === 'all' ? issues : issues.filter(i => i.status === filter),
        [issues, filter]
    );

    const toggleTimeline = useCallback((id) => {
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    const handleDeleteConfirm = useCallback((id) => setConfirmDeleteId(id), []);
    const handleDeleteCancel = useCallback(() => setConfirmDeleteId(null), []);

    const handleDelete = useCallback(async (id) => {
        try {
            await deleteMutation.mutateAsync(id);
            setConfirmDeleteId(null);
        } catch {
            alert('Failed to delete complaint.');
        }
    }, [deleteMutation]);

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container max-w-[900px]">
                <div className="page-header">
                    <h1>My Complaints</h1>
                    <p className="subtitle">Track all your reported issues</p>
                </div>

                {/* Filter tabs — UI state, stays local */}
                <div className="tabs">
                    {['all', 'pending', 'verified', 'in_progress', 'resolved', 'rejected'].map(status => (
                        <button
                            key={status}
                            className={`tab-btn ${filter === status ? 'active' : ''}`}
                            onClick={() => setFilter(status)}
                        >
                            {status === 'all' ? 'All' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16"><LoadingSpinner size={32} /></div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredIssues.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={48} />
                                <h3>No complaints found</h3>
                                <p>You haven't reported any issues yet</p>
                            </div>
                        ) : (
                            filteredIssues.map((issue) => (
                                <div key={issue.id} className="complaint-card bg-white border-gray-200">
                                    <div className="complaint-card-header">
                                        <div className="avatar">
                                            {(issue.reporter_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="complaint-card-info">
                                            <h3>{issue.title}</h3>
                                            <div className="complaint-card-meta">
                                                {getTimeAgo(issue.created_at)} • {issue.category}
                                            </div>
                                            <div className="complaint-card-location">
                                                <MapPin size={12} />
                                                <span>{issue.address || (issue.lat && issue.lng ? `${issue.lat}, ${issue.lng}` : 'Location not available')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`badge ${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteConfirm(issue.id)}
                                                title="Delete complaint"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="complaint-card-desc">{issue.description}</div>

                                    {issue.photo_url && (
                                        <img src={issue.photo_url} alt={issue.title} className="complaint-card-photo" />
                                    )}

                                    {/* Delete confirmation */}
                                    {confirmDeleteId === issue.id && (
                                        <div className="delete-confirm-row">
                                            <span className="delete-confirm-text">🗑️ Delete this complaint permanently?</span>
                                            <button
                                                className="delete-confirm-yes"
                                                onClick={() => handleDelete(issue.id)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                {deleteMutation.isPending ? <LoadingSpinner size={12} color="white" /> : 'Yes, Delete'}
                                            </button>
                                            <button
                                                className="delete-confirm-no"
                                                onClick={handleDeleteCancel}
                                                disabled={deleteMutation.isPending}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    <MiniTimeline timeline={issue.timeline} status={issue.status} />

                                    <button
                                        className="flex items-center gap-1.5 mt-2 py-1.5 px-3 rounded-xl text-[0.8rem] font-bold text-gray-500 bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:text-black w-full [font-family:inherit]"
                                        onClick={() => toggleTimeline(issue.id)}
                                    >
                                        {expandedId === issue.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        {expandedId === issue.id ? 'Hide Timeline' : 'View Full Timeline'}
                                    </button>

                                    {expandedId === issue.id && (
                                        <div className="mt-2 py-3 px-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <ProgressTimeline timeline={issue.timeline} status={issue.status} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyComplaints;
