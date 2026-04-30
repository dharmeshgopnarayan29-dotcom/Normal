import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import { Flag, RotateCcw, MapPin, Camera, AlertTriangle } from 'lucide-react';

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

const FlaggedIssues = () => {
    const [issues, setIssues] = useState([]);
    const [restoring, setRestoring] = useState(null);

    useEffect(() => { fetchFlagged(); }, []);

    const fetchFlagged = async () => {
        try {
            const res = await api.get('issues/flagged/');
            setIssues(res.data);
        } catch (err) { console.error('Failed to fetch flagged issues', err); }
    };

    const handleRestore = async (id) => {
        setRestoring(id);
        try {
            await api.post(`issues/${id}/restore/`);
            fetchFlagged();
        } catch (err) {
            alert('Restore failed');
        }
        setRestoring(null);
    };

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container max-w-[900px]">
                <div className="page-header">
                    <h1>Flagged Issues</h1>
                    <p className="subtitle">Review issues flagged by the community</p>
                </div>

                {issues.length === 0 ? (
                    <div className="empty-state">
                        <Flag size={48} />
                        <h3>No flagged issues</h3>
                        <p>All clear — no issues have been flagged by the community.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {issues.map((issue, idx) => (
                            <div key={issue.id} className="complaint-card bg-white border-gray-200" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="complaint-card-header">
                                    <div className="avatar">
                                        {(issue.reporter_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="complaint-card-info">
                                        <h3>{issue.title}</h3>
                                        <div className="complaint-card-meta">
                                            by {issue.reporter_name || 'Unknown'} • {getTimeAgo(issue.created_at)}
                                        </div>
                                        <div className="complaint-card-location">
                                            <MapPin size={12} />
                                            <span>{issue.address || (issue.lat && issue.lng ? `${issue.lat}, ${issue.lng}` : 'Location not available')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`badge ${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                <div className="complaint-card-desc">{issue.description}</div>

                                {issue.photo && (
                                    <img
                                        src={issue.photo.startsWith('http') ? issue.photo : `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/').replace('/api/', '')}${issue.photo}`}
                                        alt={issue.title}
                                        className="complaint-card-photo"
                                    />
                                )}

                                <div className="complaint-card-footer">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 text-[0.85rem] font-bold text-gray-700">
                                            <AlertTriangle size={14} className="text-black" />
                                            {issue.flag_count} flag{issue.flag_count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-[0.8rem] text-gray-400">•</span>
                                        <span className="text-[0.8rem] text-gray-500 font-medium">
                                            {issue.upvote_count} upvote{issue.upvote_count !== 1 ? 's' : ''} • {issue.comment_count} comment{issue.comment_count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <button
                                        className="btn-primary py-2.5 px-5 text-[0.85rem]"
                                        onClick={() => handleRestore(issue.id)}
                                        disabled={restoring === issue.id}
                                    >
                                        <RotateCcw size={14} />
                                        {restoring === issue.id ? 'Restoring...' : 'Restore Issue'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlaggedIssues;
