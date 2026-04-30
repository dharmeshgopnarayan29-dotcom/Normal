import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import BorderGlow from '../components/BorderGlow';
import { MiniTimeline } from '../components/ProgressTimeline';

const AllComplaints = () => {
    const [issues, setIssues] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => { fetchData(); }, []);

    // Reset page to 1 when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, search, issues.length]);

    const fetchData = async () => {
        try {
            const res = await api.get('issues/');
            setIssues(res.data);
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`issues/${id}/`, { status });
            fetchData();
        } catch (err) { alert('Status update failed'); }
    };

    const filtered = issues
        .filter(i => filter === 'all' || i.status === filter)
        .filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.reporter_name?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedIssues = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container-wide">
                <div className="page-header">
                    <h1>All Complaints</h1>
                    <p className="subtitle">Manage and triage all reported issues</p>
                </div>

                {/* Search + Filters */}
                <div className="flex gap-4 mb-6 flex-wrap items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input className="input-field pl-9" placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="tabs !mb-0">
                        {['all', 'pending', 'verified', 'in_progress', 'resolved', 'rejected'].map(s => (
                            <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                                {s === 'all' ? 'All' : s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <BorderGlow className="table-container" borderRadius={24} edgeSensitivity={60} glowIntensity={0.6}>
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Reporter</th>
                                <th>Category</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedIssues.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-8 text-slate-500">No complaints found</td></tr>
                            ) : (
                                paginatedIssues.map(iss => (
                                    <tr key={iss.id}>
                                        <td>
                                            <div className="font-medium">{iss.title}</div>
                                            <div className="text-[0.8rem] text-slate-500 mt-0.5">{iss.description?.substring(0, 60)}...</div>
                                        </td>
                                        <td>{iss.reporter_name || 'Unknown'}</td>
                                        <td className="capitalize">{iss.category}</td>
                                        <td>
                                            <div className="min-w-[200px]">
                                                <MiniTimeline timeline={iss.timeline} status={iss.status} />
                                            </div>
                                        </td>
                                        <td><span className={`badge ${iss.status}`}>{iss.status.replace('_', ' ')}</span></td>
                                        <td>
                                            <select className="select-field w-[130px] py-1.5 px-2.5 text-[0.8rem]" value={iss.status} onChange={e => updateStatus(iss.id, e.target.value)}>
                                                <option value="pending">Pending</option>
                                                <option value="verified">Verified</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </BorderGlow>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 glass !p-3 !rounded-[16px]">
                        <button 
                            onClick={handlePrev} 
                            disabled={currentPage === 1}
                            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-[0.85rem] font-bold transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-50 border border-slate-100' : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        
                        <span className="text-[0.85rem] text-slate-500 font-medium">
                            Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
                        </span>

                        <button 
                            onClick={handleNext} 
                            disabled={currentPage === totalPages}
                            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-[0.85rem] font-bold transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-50 border border-slate-100' : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllComplaints;
