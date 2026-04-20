import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import { Bookmark, MapPin, Camera } from 'lucide-react';

const getCategoryBgColor = (cat) => {
    switch (cat?.toLowerCase()) {
        case 'roads': return 'bg-blue-100 border-blue-200';
        case 'sanitation': return 'bg-emerald-100 border-emerald-200';
        case 'electricity': return 'bg-amber-100 border-amber-200';
        case 'water': return 'bg-cyan-100 border-cyan-200';
        case 'public_safety': return 'bg-rose-100 border-rose-200';
        default: return 'bg-slate-100 border-slate-200';
    }
};

const SavedProblems = () => {
    const [issues, setIssues] = useState([]);
    const [saved, setSaved] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('issues/');
                setIssues(res.data);
                // Load saved IDs from localStorage
                const savedIds = JSON.parse(localStorage.getItem('savedProblems') || '[]');
                setSaved(savedIds);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    const toggleSave = (id) => {
        const updated = saved.includes(id) ? saved.filter(s => s !== id) : [...saved, id];
        setSaved(updated);
        localStorage.setItem('savedProblems', JSON.stringify(updated));
    };

    const savedIssues = issues.filter(i => saved.includes(i.id));

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`issues/${id}/`, { status });
            const res = await api.get('issues/');
            setIssues(res.data);
        } catch (err) { alert('Status update failed'); }
    };

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container max-w-[900px]">
                <div className="page-header">
                    <h1>Saved Problems</h1>
                    <p className="subtitle">Issues you've bookmarked for follow-up</p>
                </div>

                {savedIssues.length === 0 ? (
                    <div className="empty-state">
                        <Bookmark size={48} />
                        <h3>No saved problems</h3>
                        <p>Bookmark issues from All Complaints to track them here</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {savedIssues.map((issue, idx) => (
                            <div key={issue.id} className={`complaint-card ${getCategoryBgColor(issue.category)}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="complaint-card-header">
                                    <div className="avatar">
                                        {(issue.reporter_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="complaint-card-info">
                                        <h3>{issue.title}</h3>
                                        <div className="complaint-card-location">
                                            <MapPin size={12} />
                                            <span>{issue.lat}, {issue.lng}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`badge ${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                                        <button onClick={() => toggleSave(issue.id)} className="bg-transparent border-none cursor-pointer p-1">
                                            <Bookmark size={18} fill="#f59e0b" color="#f59e0b" />
                                        </button>
                                    </div>
                                </div>
                                <div className="complaint-card-desc">{issue.description}</div>
                                <div className="complaint-card-footer">
                                    <span className="badge-category">{issue.category}</span>
                                    <select className="select-field w-[130px] py-1.5 px-2.5 text-[0.8rem] !mt-0" value={issue.status} onChange={e => updateStatus(issue.id, e.target.value)}>
                                        <option value="pending">Pending</option>
                                        <option value="verified">Verified</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Show all issues to bookmark */}
                {savedIssues.length < issues.length && (
                    <div className="mt-8">
                        <h3 className="text-[1.1rem] font-semibold mb-4 text-slate-600">All Issues — Click bookmark to save</h3>
                        <div className="flex flex-col gap-3">
                            {issues.filter(i => !saved.includes(i.id)).map(issue => (
                                <div key={issue.id} className="glass-card p-4 flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{issue.title}</div>
                                        <div className="text-[0.8rem] text-slate-500 mt-0.5">{issue.category} • {issue.status.replace('_', ' ')}</div>
                                    </div>
                                    <button onClick={() => toggleSave(issue.id)} className="bg-transparent border-none cursor-pointer p-1.5">
                                        <Bookmark size={18} color="#64748b" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedProblems;
