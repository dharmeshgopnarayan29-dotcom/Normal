import React, { useState, useCallback, useMemo, useContext } from 'react';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';
import CommunityFeed from '../components/CommunityFeed';
import ReportIssueModal from '../components/ReportIssueModal';
import BadgeShowcase from '../components/BadgeShowcase';
import BadgeToast from '../components/BadgeToast';
import { Plus, FileText, TrendingUp, Eye, Search, X, MapPin } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useComplaints, useAddComplaint } from '../hooks/useComplaints';
import { useMyComplaints } from '../hooks/useMyComplaints';

const CitizenDashboard = () => {
    const { user } = useContext(AuthContext);
    const [locationQuery, setLocationQuery] = useState('');
    const [activeLocationFilter, setActiveLocationFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newlyEarnedBadges, setNewlyEarnedBadges] = useState([]);

    // ── React Query: complaints feed (cached, instant on re-visit) ──
    const { data: issues = [], isLoading: issuesLoading } = useComplaints(activeLocationFilter);
    const { data: userIssues = [] } = useMyComplaints();

    // ── Mutations ──
    const addComplaintMutation = useAddComplaint();

    // ── Derived stats (memoized — only recalculates when issues changes) ──
    const totalComplaints = useMemo(() => issues.length, [issues]);
    const resolvedCount = useMemo(() => issues.filter(i => i.status === 'resolved').length, [issues]);
    const pendingCount = useMemo(() => issues.filter(i => i.status === 'pending').length, [issues]);
    const userTotalComplaints = useMemo(() => userIssues.length, [userIssues]);
    const userResolvedCount = useMemo(() => userIssues.filter(i => i.status === 'resolved').length, [userIssues]);
    const userPendingCount = useMemo(() => userIssues.filter(i => i.status === 'pending').length, [userIssues]);

    const stats = useMemo(() => [
        { icon: <FileText size={28} />, value: totalComplaints, label: 'Total Complaints', color: '#000000', bgColor: 'bg-white border-gray-200' },
        { icon: <TrendingUp size={28} />, value: resolvedCount, label: 'Resolved Issues', color: '#374151', bgColor: 'bg-white border-gray-200' },
        { icon: <Eye size={28} />, value: pendingCount, label: 'Pending Review', color: '#6b7280', bgColor: 'bg-white border-gray-200' },
    ], [totalComplaints, resolvedCount, pendingCount]);

    // ── Handlers (useCallback so child components don't re-render unnecessarily) ──
    const handleSubmitReport = useCallback(async (formData) => {
        try {
            const data = await addComplaintMutation.mutateAsync(formData);
            setShowModal(false);
            // Fire badge toast if any new badges were earned
            if (data?.newly_earned_badges?.length > 0) {
                setNewlyEarnedBadges(data.newly_earned_badges);
            }
        } catch (err) {
            let errorMsg = 'Failed to report issue.';
            if (err.response?.data) {
                const d = err.response.data;
                if (d.address) errorMsg = Array.isArray(d.address) ? d.address[0] : d.address;
                else if (d.detail) errorMsg = d.detail;
                else errorMsg = JSON.stringify(d);
            }
            alert(errorMsg);
        }
    }, [addComplaintMutation]);

    const handleLocationSearch = useCallback((e) => {
        e.preventDefault();
        setActiveLocationFilter(locationQuery.trim());
    }, [locationQuery]);

    const handleClearLocation = useCallback(() => {
        setLocationQuery('');
        setActiveLocationFilter('');
    }, []);

    const username = user?.email ? user.email.split('@')[0] : 'Citizen';
    const initial = username.charAt(0).toUpperCase();

    return (
        <div className="dashboard-bg">
            <Navbar />

            <div className="citizen-layout">
                {/* LEFT SIDEBAR */}
                <div className="left-sidebar">
                    {/* Profile Avatar */}
                    <div className="glass text-center !p-6 py-8 bg-white border-gray-200">
                        <div className="w-[80px] h-[80px] rounded-full bg-black text-white flex items-center justify-center text-[2.5rem] font-bold mx-auto mb-5 shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                            {initial}
                        </div>
                        <h3 className="text-[1.25rem] font-bold text-black m-0">Hii {user?.username || username}!</h3>
                    </div>

                    {/* Tier Badge Widget */}
                    <div className="glass !p-0 overflow-hidden border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h4 className="text-[0.8rem] text-gray-500 uppercase tracking-[1px] font-semibold m-0">Reporter Tier</h4>
                        </div>
                        <div className="p-4">
                            <BadgeShowcase compact={true} />
                        </div>
                    </div>

                    {/* Personal Summary */}
                    <div className="px-2">
                        <h4 className="text-[0.85rem] text-gray-500 uppercase tracking-[1px] mb-3 font-semibold">Your Activity</h4>
                        <div className="flex flex-col gap-2.5 text-[0.9rem]">
                            <div className="flex justify-between text-gray-600">
                                <span>Complaints Reported:</span>
                                <strong className="text-black">{userTotalComplaints}</strong>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Resolved:</span>
                                <strong className="text-black">{userResolvedCount}</strong>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Pending:</span>
                                <strong className="text-black">{userPendingCount}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    {userIssues.length > 0 && (
                        <div className="px-2 mt-auto">
                            <h4 className="text-[0.85rem] text-gray-500 uppercase tracking-[1px] mb-3 font-semibold">Recent Actions</h4>
                            <div className="flex flex-col gap-3">
                                {userIssues.slice(0, 3).map((issue) => (
                                    <div key={issue.id} className="flex gap-2.5 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                                        <div className="text-[0.85rem]">
                                            <div className="text-black font-medium mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">{issue.title}</div>
                                            <div className="text-gray-500 text-[0.75rem] capitalize">{issue.status.replace('_', ' ')} &middot; {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Recently'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* CENTER: Main Feed */}
                <div className="center-content">
                    {/* Location Search Bar */}
                    <form onSubmit={handleLocationSearch} className="location-search-bar">
                        <Search size={16} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Filter by location (e.g. Whitefield, BTM Layout...)"
                            value={locationQuery}
                            onChange={e => setLocationQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-[0.9rem] text-black placeholder:text-gray-400 font-medium"
                        />
                        {activeLocationFilter && (
                            <button type="button" onClick={handleClearLocation} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
                                <X size={14} className="text-gray-500" />
                            </button>
                        )}
                        <button type="submit" className="py-1.5 px-4 bg-black text-white text-[0.8rem] font-bold rounded-xl hover:bg-gray-800 transition-all">
                            Search
                        </button>
                    </form>

                    {activeLocationFilter && (
                        <div className="flex items-center gap-2 mb-4 text-[0.8rem] text-gray-500 font-medium">
                            <MapPin size={12} /> Showing results for: <strong className="text-black">{activeLocationFilter}</strong>
                            <button onClick={handleClearLocation} className="text-black underline ml-1 cursor-pointer bg-transparent border-none text-[0.8rem] font-bold">Clear</button>
                        </div>
                    )}

                    {/* Pass issues from React Query — no manual onRefresh needed */}
                    <CommunityFeed issues={issues} isLoading={issuesLoading} />
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="right-sidebar">
                    <div className="action-card glass bg-gray-50 border-gray-200">
                        <h3>Report Issues in Your Community</h3>
                        <p>Take photos, add descriptions, and track the progress of your complaints.</p>
                        <div className="action-buttons">
                            <button
                                className="btn-primary w-full justify-center p-4"
                                onClick={() => setShowModal(true)}
                            >
                                <Plus size={18} /> Add Complaint
                            </button>
                        </div>
                    </div>
                    <StatsBar stats={stats} />
                </div>
            </div>

            <ReportIssueModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmitReport}
                submitting={addComplaintMutation.isPending}
            />
            <BadgeToast badges={newlyEarnedBadges} />
        </div>
    );
};

export default CitizenDashboard;
