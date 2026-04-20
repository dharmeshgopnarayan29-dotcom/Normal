import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';
import CommunityFeed from '../components/CommunityFeed';
import ReportIssueModal from '../components/ReportIssueModal';
import api from '../api';
import { Camera, Plus, FileText, TrendingUp, Eye, MapPin, Download } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const CitizenDashboard = () => {
    const { user } = useContext(AuthContext);
    const [issues, setIssues] = useState([]);
    const [userIssues, setUserIssues] = useState([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => { 
        fetchIssues(); 
        fetchUserIssues();
    }, []);

    const fetchIssues = async () => {
        try {
            const res = await api.get('issues/');
            setIssues(res.data);
        } catch (err) { console.error('Failed to fetch issues', err); }
    };

    const fetchUserIssues = async () => {
        try {
            const res = await api.get('issues/my/');
            setUserIssues(res.data);
        } catch (err) { console.error('Failed to fetch user issues', err); }
    };

    const handleSubmitReport = async (formData) => {
        try {
            await api.post('issues/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowModal(false);
            fetchIssues();
            fetchUserIssues();
        } catch (err) { alert('Failed to report issue.'); }
    };

    const totalComplaints = issues.length;
    const resolvedCount = issues.filter(i => i.status === 'resolved').length;
    const pendingCount = issues.filter(i => i.status === 'pending').length;

    // User Specific Stats
    const userTotalComplaints = userIssues.length;
    const userResolvedCount = userIssues.filter(i => i.status === 'resolved').length;
    const userPendingCount = userIssues.filter(i => i.status === 'pending').length;

    const stats = [
        { icon: <FileText size={28} />, value: totalComplaints, label: 'Total Complaints', color: '#3b82f6', bgColor: 'bg-blue-100 border-blue-200' },
        { icon: <TrendingUp size={28} />, value: resolvedCount, label: 'Resolved Issues', color: '#22c55e', bgColor: 'bg-emerald-100 border-emerald-200' },
        { icon: <Eye size={28} />, value: pendingCount, label: 'Pending Review', color: '#f59e0b', bgColor: 'bg-amber-100 border-amber-200' },
    ];

    const username = user?.email ? user.email.split('@')[0] : 'Citizen';
    const initial = username.charAt(0).toUpperCase();

    return (
        <div className="dashboard-bg">
            <Navbar />

            <div className="citizen-layout">
                {/* LEFT SIDEBAR: Profile & Personal Insights */}
                <div className="left-sidebar">
                    {/* Keep Profile as Base */}
                    <div className="glass text-center !p-6 py-8 bg-slate-100 border-slate-200">
                        <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-br from-accent-from to-accent-to text-[#194342] flex items-center justify-center text-[2.5rem] font-bold mx-auto mb-5 shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                            {initial}
                        </div>
                        <h3 className="text-[1.25rem] font-bold text-slate-900 m-0">Hii {username}!</h3>
                    </div>

                    {/* Smart Location Card */}
                    <div className="glass !p-5 flex flex-col gap-1.5 bg-emerald-100 border-emerald-200">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-[0.95rem]">
                            <MapPin size={16} color="#86efac" /> Whitefield, Bangalore
                        </div>
                        <span className="text-[0.8rem] text-slate-500 pl-6">Moderate issue activity in your area</span>
                    </div>

                    {/* Personal Summary */}
                    <div className="px-2">
                        <h4 className="text-[0.85rem] text-slate-500 uppercase tracking-[1px] mb-3 font-semibold">Your Activity</h4>
                        <div className="flex flex-col gap-2.5 text-[0.9rem]">
                            <div className="flex justify-between text-slate-600">
                                <span>Complaints Reported:</span>
                                <strong className="text-slate-900">{userTotalComplaints}</strong>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Resolved:</span>
                                <strong className="text-[#86efac]">{userResolvedCount}</strong>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Pending:</span>
                                <strong className="text-[#fdba74]">{userPendingCount}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Primary Action */}
                    <button className="btn-primary w-full justify-center p-3.5 rounded-full my-2" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> Report New Issue
                    </button>

                    {/* Recent Activity */}
                    {userIssues.length > 0 && (
                        <div className="px-2 mt-auto">
                            <h4 className="text-[0.85rem] text-slate-500 uppercase tracking-[1px] mb-3 font-semibold">Recent Actions</h4>
                            <div className="flex flex-col gap-3">
                                {userIssues.slice(0, 3).map((issue, idx) => (
                                    <div key={issue.id || idx} className="flex gap-2.5 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                        <div className="text-[0.85rem]">
                                            <div className="text-slate-900 font-medium mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">{issue.title}</div>
                                            <div className="text-slate-500 text-[0.75rem] capitalize">{issue.status.replace('_', ' ')} &middot; {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Recently'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* CENTER: Main Feed */}
                <div className="center-content">
                    <CommunityFeed issues={issues} />
                </div>

                {/* RIGHT SIDEBAR: Actions & Stats */}
                <div className="right-sidebar">
                    {/* Hero Action Card */}
                    <div className="action-card glass bg-indigo-100 border-indigo-200">
                        <h3>Report Issues in Your Community</h3>
                        <p>Take photos, add descriptions, and track the progress of your complaints.</p>
                        <div className="action-buttons">
                            <button className="btn-primary w-full justify-center p-4" onClick={() => setShowModal(true)}>
                                <Plus size={18} /> Add Complaint
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <StatsBar stats={stats} />
                </div>
            </div>

            <ReportIssueModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleSubmitReport} />
        </div>
    );
};

export default CitizenDashboard;
