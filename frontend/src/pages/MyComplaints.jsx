import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { FileText, MapPin, Camera } from 'lucide-react';

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

const getCategoryBgColor = (cat) => {
    switch (cat?.toLowerCase()) {
        case 'roads': return 'bg-white border-gray-200';
        case 'sanitation': return 'bg-white border-gray-200';
        case 'electricity': return 'bg-white border-gray-200';
        case 'water': return 'bg-white border-gray-200';
        case 'public_safety': return 'bg-white border-gray-200';
        default: return 'bg-white border-gray-200';
    }
};

const MyComplaints = () => {
    const { user } = useContext(AuthContext);
    const [issues, setIssues] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchMyIssues = async () => {
            try {
                const res = await api.get('issues/');
                // Filter to only show current user's issues
                const myIssues = res.data.filter(i => i.reporter_name === user?.email?.split('@')[0] || i.reporter_name);
                setIssues(res.data);
            } catch (err) {
                console.error('Failed to fetch', err);
            }
        };
        fetchMyIssues();
    }, [user]);

    const filteredIssues = filter === 'all' ? issues : issues.filter(i => i.status === filter);

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container max-w-[900px]">
                <div className="page-header">
                    <h1>My Complaints</h1>
                    <p className="subtitle">Track all your reported issues</p>
                </div>

                {/* Filter tabs */}
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

                <div className="flex flex-col gap-4">
                    {filteredIssues.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={48} />
                            <h3>No complaints found</h3>
                            <p>You haven't reported any issues yet</p>
                        </div>
                    ) : (
                        filteredIssues.map((issue, idx) => (
                            <div key={issue.id} className={`complaint-card ${getCategoryBgColor(issue.category)}`} style={{ animationDelay: `${idx * 0.05}s` }}>
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
                                            <span>{issue.lat}, {issue.lng}</span>
                                        </div>
                                    </div>
                                    <span className={`badge ${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                                </div>
                                <div className="complaint-card-desc">{issue.description}</div>
                                {issue.photo && (
                                    <img src={`http://localhost:8000${issue.photo}`} alt={issue.title} className="complaint-card-photo" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyComplaints;
