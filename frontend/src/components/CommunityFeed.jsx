import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Check, X, Play, CheckCircle, ChevronLeft, ChevronRight, ThumbsUp, Flag, MessageCircle, Send } from 'lucide-react';
import api from '../api';
import { MiniTimeline } from './ProgressTimeline';

const getTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
};

const getCategoryBgColor = (category) => {
    switch (category?.toLowerCase()) {
        case 'roads': return 'bg-white border-gray-200';
        case 'sanitation': return 'bg-white border-gray-200';
        case 'water': return 'bg-white border-gray-200';
        case 'electricity': return 'bg-white border-gray-200';
        default: return 'bg-white border-gray-200';
    }
};

const getCategoryPillColor = (category) => {
    switch (category?.toLowerCase()) {
        case 'roads': return 'bg-black text-white';
        case 'sanitation': return 'bg-black text-white';
        case 'water': return 'bg-black text-white';
        case 'electricity': return 'bg-black text-white';
        default: return 'bg-black text-white';
    }
};

// ── Comment Section Component ──
const CommentSection = ({ issueId, commentCount }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await api.get(`issues/${issueId}/comments/`);
            setComments(res.data);
        } catch (err) { console.error('Failed to fetch comments', err); }
    };

    useEffect(() => {
        if (expanded) fetchComments();
    }, [expanded]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            await api.post(`issues/${issueId}/comments/`, { text: newComment.trim() });
            setNewComment('');
            fetchComments();
        } catch (err) { console.error('Failed to post comment', err); }
        setLoading(false);
    };

    return (
        <div className="comment-section">
            <button
                className="comment-toggle-btn"
                onClick={() => setExpanded(!expanded)}
            >
                <MessageCircle size={14} />
                <span>{commentCount || 0} Comment{commentCount !== 1 ? 's' : ''}</span>
                <span className="ml-auto text-[0.7rem] text-gray-400">{expanded ? '▲' : '▼'}</span>
            </button>

            {expanded && (
                <div className="comment-body">
                    {/* Comment list */}
                    <div className="comment-list">
                        {comments.length === 0 ? (
                            <p className="text-[0.8rem] text-gray-400 text-center py-3">No comments yet. Be the first!</p>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="comment-item">
                                    <div className="comment-avatar">
                                        {(c.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[0.8rem] font-bold text-black">{c.username}</span>
                                            <span className="text-[0.7rem] text-gray-400">{getTimeAgo(c.created_at)}</span>
                                        </div>
                                        <p className="text-[0.83rem] text-gray-700 mt-0.5 leading-relaxed break-words">{c.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add comment form */}
                    <form onSubmit={handleSubmit} className="comment-input-row">
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            className="comment-input"
                        />
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="comment-send-btn"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

const CommunityFeed = ({ issues, isAdmin = false, onStatusChange, onRefresh, emptyTitle, emptyDesc }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset to page 1 if issues array changes length
    useEffect(() => {
        setCurrentPage(1);
    }, [issues.length]);

    // Filter out rejected issues from the feed (they remain in MyComplaints/AllComplaints)
    const feedIssues = issues.filter(i => i.status !== 'rejected');

    // Ensure issues are sorted newest first
    const sortedIssues = [...feedIssues].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalPages = Math.ceil(sortedIssues.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedIssues = sortedIssues.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    // ── Upvote handler ──
    const handleUpvote = async (issueId) => {
        try {
            await api.post(`issues/${issueId}/upvote/`);
            if (onRefresh) onRefresh();
        } catch (err) { console.error('Upvote failed', err); }
    };

    // ── Flag toggle handler ──
    const handleFlag = async (issueId) => {
        try {
            await api.post(`issues/${issueId}/flag/`);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Flag toggle failed', err);
        }
    };

    return (
        <div>
            <div className="section-header">
                <h2>{isAdmin ? 'Complaint Management' : 'Community Feed'}</h2>
                <p>{isAdmin ? 'Manage and update incoming reports' : 'Recent complaints from your community'}</p>
            </div>

            <div className="feed-list">
                {issues.length === 0 ? (
                    <div className="empty-state">
                        <Camera size={48} />
                        <h3>{emptyTitle || "No issues reported yet"}</h3>
                        <p>{emptyDesc || (isAdmin ? 'No pending issues to manage.' : 'Be the first to report an issue in your community.')}</p>
                    </div>
                ) : (
                    paginatedIssues.map((issue, idx) => (
                        <div key={issue.id} className={`complaint-card ${getCategoryBgColor(issue.category)}`} style={{ animationDelay: `${idx * 0.05}s` }}>
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
                                        <MapPin size={12} className="shrink-0" />
                                        <span title={issue.address || (issue.lat && issue.lng ? `${issue.lat}, ${issue.lng}` : 'Location not available')}>
                                            {issue.address || (issue.lat && issue.lng ? `${issue.lat}, ${issue.lng}` : 'Location not available')}
                                        </span>
                                    </div>
                                </div>
                                <span className={`badge ${issue.status}`}>
                                    {issue.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="complaint-card-desc">
                                {issue.description}
                            </div>

                            {issue.photo && (
                                <img
                                    src={issue.photo.startsWith('http') ? issue.photo : `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/').replace('/api/', '')}${issue.photo}`}
                                    alt={issue.title}
                                    className="complaint-card-photo"
                                />
                            )}

                            <div className="complaint-card-footer flex-wrap">
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${getCategoryPillColor(issue.category)}`}>
                                        {issue.category}
                                    </span>

                                    {/* Upvote Button */}
                                    <button
                                        className={`action-icon-btn ${issue.has_upvoted ? 'active' : ''}`}
                                        onClick={() => handleUpvote(issue.id)}
                                        title={issue.has_upvoted ? 'Remove upvote' : 'Upvote'}
                                    >
                                        <ThumbsUp size={14} fill={issue.has_upvoted ? 'currentColor' : 'none'} />
                                        <span>{issue.upvote_count || 0}</span>
                                    </button>

                                    {/* Flag Button — citizen only, toggleable */}
                                    {!isAdmin && (
                                        <button
                                            className={`action-icon-btn flag-btn-toggle ${issue.has_flagged ? 'flagged' : ''}`}
                                            onClick={() => handleFlag(issue.id)}
                                            title={issue.has_flagged ? 'Unflag this issue' : 'Flag this issue'}
                                        >
                                            <Flag size={14} fill={issue.has_flagged ? 'currentColor' : 'none'} />
                                        </button>
                                    )}

                                    {/* Flag count for admin */}
                                    {isAdmin && issue.flag_count > 0 && (
                                        <span className="action-icon-btn flagged" title={`${issue.flag_count} flag(s)`}>
                                            <Flag size={14} fill="currentColor" />
                                            <span>{issue.flag_count}</span>
                                        </span>
                                    )}
                                </div>
                                
                                {isAdmin && onStatusChange && (
                                    <div className="quick-action-row !mt-0">
                                        {issue.status === 'pending' && (
                                            <>
                                                <button className="quick-action-btn approve" onClick={() => onStatusChange(issue.id, 'verified')}>
                                                    <Check size={14} /> Verify
                                                </button>
                                                <button className="quick-action-btn reject" onClick={() => onStatusChange(issue.id, 'rejected')}>
                                                    <X size={14} /> Reject
                                                </button>
                                            </>
                                        )}
                                        {issue.status === 'verified' && (
                                            <button className="quick-action-btn resolve" onClick={() => onStatusChange(issue.id, 'in_progress')}>
                                                <Play size={14} /> Start
                                            </button>
                                        )}
                                        {issue.status === 'in_progress' && (
                                            <button className="quick-action-btn approve" onClick={() => onStatusChange(issue.id, 'resolved')}>
                                                <CheckCircle size={14} /> Resolve
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Mini Timeline */}
                            <MiniTimeline timeline={issue.timeline} status={issue.status} />

                            {/* Comment Section */}
                            <CommentSection issueId={issue.id} commentCount={issue.comment_count} />
                        </div>
                    ))
                )}
            </div>
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
    );
};

export default CommunityFeed;
