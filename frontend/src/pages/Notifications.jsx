import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import { Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

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

const getNotificationIcon = (status) => {
    switch (status) {
        case 'resolved': return <CheckCircle2 size={20} color="#000000" />;
        case 'rejected': return <AlertTriangle size={20} color="#374151" />;
        case 'in_progress': return <Info size={20} color="#374151" />;
        default: return <Bell size={20} color="#000000" />;
    }
};

const getNotificationColor = (status) => {
    switch (status) {
        case 'resolved': return 'bg-white border-gray-200';
        case 'rejected': return 'bg-white border-gray-200';
        case 'in_progress': return 'bg-white border-gray-200';
        default: return 'bg-white border-gray-200';
    }
};

const Notifications = () => {
    const [issues, setIssues] = useState([]);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const res = await api.get('issues/');
                setIssues(res.data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
            } catch (err) {
                console.error('Failed to fetch', err);
            }
        };
        fetchIssues();
    }, []);

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container max-w-[720px]">
                <div className="page-header">
                    <h1>Notifications</h1>
                    <p className="subtitle">Stay updated on your reported issues</p>
                </div>

                <div className="flex flex-col gap-3">
                    {issues.length === 0 ? (
                        <div className="empty-state">
                            <Bell size={48} />
                            <h3>No notifications yet</h3>
                            <p>You'll be notified when there are updates on your complaints</p>
                        </div>
                    ) : (
                        issues.map((issue, idx) => (
                            <div key={issue.id} className={`notification-card animate-[fadeInUp_0.3s_ease_forwards] ${getNotificationColor(issue.status)} ${issue.status !== 'resolved' ? 'unread' : ''}`} style={{ animationDelay: `${idx * 0.03}s` }}>
                                {getNotificationIcon(issue.status)}
                                <div className="flex-1">
                                    <div className="font-semibold text-[0.9rem] mb-1">
                                        {issue.title}
                                    </div>
                                    <div className="text-[0.85rem] text-slate-600">
                                        Status changed to <span className={`badge ${issue.status} ml-1`}>{issue.status.replace('_', ' ')}</span>
                                    </div>
                                    <div className="text-[0.75rem] text-slate-500 mt-1.5">
                                        {getTimeAgo(issue.updated_at)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
