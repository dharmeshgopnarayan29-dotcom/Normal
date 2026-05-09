import React, { useState, useContext, useCallback } from 'react';
import { MapPin, Camera, Check, X, Play, CheckCircle, ChevronLeft, ChevronRight, ThumbsUp, Flag, MessageCircle, Send, Trash2 } from 'lucide-react';
import { MiniTimeline } from './ProgressTimeline';
import LoadingSpinner from './LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import { useToggleUpvote, useToggleFlag, useDeleteComplaint } from '../hooks/useComplaints';
import { useComments, useAddComment } from '../hooks/useComments';

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

const getCategoryPillColor = () => 'bg-black text-white';

// ── Comment Section — self-contained with its own React Query cache ──
const CommentSection = React.memo(({ issueId, commentCount }) => {
    const [newComment, setNewComment] = useState('');
    const [expanded, setExpanded] = useState(false);

    // Lazy fetch: only runs when expanded = true
    const { data: comments = [] } = useComments(issueId, expanded);
    const addCommentMutation = useAddComment(issueId);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await addCommentMutation.mutateAsync({ text: newComment.trim() });
            setNewComment('');
        } catch { /* silent */ }
    }, [newComment, addCommentMutation]);

    return (
        <div className="comment-section">
            <button className="comment-toggle-btn" onClick={() => setExpanded(e => !e)}>
                <MessageCircle size={14} />
                <span>{commentCount || 0} Comment{commentCount !== 1 ? 's' : ''}</span>
                <span className="ml-auto text-[0.7rem] text-gray-400">{expanded ? '▲' : '▼'}</span>
            </button>
            {expanded && (
                <div className="comment-body">
                    <div className="comment-list">
                        {comments.length === 0 ? (
                            <p className="text-[0.8rem] text-gray-400 text-center py-3">No comments yet. Be the first!</p>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="comment-item">
                                    <div className="comment-avatar">{(c.username || 'U').charAt(0).toUpperCase()}</div>
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
                    <form onSubmit={handleSubmit} className="comment-input-row">
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            className="comment-input"
                        />
                        <button type="submit" disabled={addCommentMutation.isPending || !newComment.trim()} className="comment-send-btn">
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
});

CommentSection.displayName = 'CommentSection';

// ── Individual complaint card ──
const ComplaintCard = React.memo(({ issue, isAdmin, onStatusChange, index }) => {
    const { user } = useContext(AuthContext);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const upvoteMutation = useToggleUpvote();
    const flagMutation = useToggleFlag();
    const deleteMutation = useDeleteComplaint();

    const canDelete = isAdmin || (user && String(user.id) === String(issue.reported_by));

    const handleUpvote = useCallback(() => {
        upvoteMutation.mutate(issue.id);
    }, [issue.id, upvoteMutation]);

    const handleFlag = useCallback(() => {
        flagMutation.mutate(issue.id);
    }, [issue.id, flagMutation]);

    const handleDelete = useCallback(async () => {
        try {
            await deleteMutation.mutateAsync(issue.id);
            setConfirmDelete(false);
        } catch {
            alert('Failed to delete complaint.');
        }
    }, [issue.id, deleteMutation]);

    const handleStatusChange = useCallback((newStatus) => {
        if (onStatusChange) onStatusChange(issue.id, newStatus);
    }, [issue.id, onStatusChange]);

    return (
        <div className={`complaint-card ${getCategoryBgColor(issue.category)}`} style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="complaint-card-header">
                <div className="avatar">{(issue.reporter_name || 'U').charAt(0).toUpperCase()}</div>
                <div className="complaint-card-info">
                    <h3>{issue.title}</h3>
                    <div className="complaint-card-meta">by {issue.reporter_name || 'Unknown'} • {getTimeAgo(issue.created_at)}</div>
                    <div className="complaint-card-location">
                        <MapPin size={12} className="shrink-0" />
                        <span title={issue.address}>{issue.address || (issue.lat && issue.lng ? `${issue.lat}, ${issue.lng}` : 'Location not available')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge ${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                    {canDelete && (
                        <button className="delete-btn" onClick={() => setConfirmDelete(true)} title="Delete complaint">
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>

            <div className="complaint-card-desc">{issue.description}</div>

            {issue.photo_url && (
                <img src={issue.photo_url} alt={issue.title} className="complaint-card-photo" />
            )}

            {/* Delete confirmation */}
            {canDelete && confirmDelete && (
                <div className="delete-confirm-row">
                    <span className="delete-confirm-text">🗑️ Delete this complaint permanently?</span>
                    <button className="delete-confirm-yes" onClick={handleDelete} disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? <LoadingSpinner size={12} color="white" /> : 'Yes, Delete'}
                    </button>
                    <button className="delete-confirm-no" onClick={() => setConfirmDelete(false)} disabled={deleteMutation.isPending}>Cancel</button>
                </div>
            )}

            <div className="complaint-card-footer flex-wrap">
                <div className="flex items-center gap-3">
                    <span className={`badge ${getCategoryPillColor()}`}>{issue.category}</span>

                    <button
                        className={`action-icon-btn ${issue.has_upvoted ? 'active' : ''}`}
                        onClick={handleUpvote}
                        disabled={upvoteMutation.isPending}
                        title={issue.has_upvoted ? 'Remove upvote' : 'Upvote'}
                    >
                        {upvoteMutation.isPending ? <LoadingSpinner size={14} /> : <ThumbsUp size={14} fill={issue.has_upvoted ? 'currentColor' : 'none'} />}
                        <span>{issue.upvote_count || 0}</span>
                    </button>

                    {!isAdmin && (
                        <button
                            className={`action-icon-btn flag-btn-toggle ${issue.has_flagged ? 'flagged' : ''}`}
                            onClick={handleFlag}
                            disabled={flagMutation.isPending}
                            title={issue.has_flagged ? 'Unflag' : 'Flag'}
                        >
                            {flagMutation.isPending ? <LoadingSpinner size={14} /> : <Flag size={14} fill={issue.has_flagged ? 'currentColor' : 'none'} />}
                        </button>
                    )}

                    {isAdmin && issue.flag_count > 0 && (
                        <span className="action-icon-btn flagged" title={`${issue.flag_count} flag(s)`}>
                            <Flag size={14} fill="currentColor" /><span>{issue.flag_count}</span>
                        </span>
                    )}
                </div>

                {isAdmin && onStatusChange && (
                    <div className="quick-action-row !mt-0">
                        {issue.status === 'pending' && (
                            <>
                                <button className="quick-action-btn approve" onClick={() => handleStatusChange('verified')}><Check size={14} /> Verify</button>
                                <button className="quick-action-btn reject" onClick={() => handleStatusChange('rejected')}><X size={14} /> Reject</button>
                            </>
                        )}
                        {issue.status === 'verified' && (
                            <button className="quick-action-btn resolve" onClick={() => handleStatusChange('in_progress')}><Play size={14} /> Start</button>
                        )}
                        {issue.status === 'in_progress' && (
                            <button className="quick-action-btn approve" onClick={() => handleStatusChange('resolved')}><CheckCircle size={14} /> Resolve</button>
                        )}
                    </div>
                )}
            </div>

            <MiniTimeline timeline={issue.timeline} status={issue.status} />
            <CommentSection issueId={issue.id} commentCount={issue.comment_count} />
        </div>
    );
});

ComplaintCard.displayName = 'ComplaintCard';

// ── Main CommunityFeed ──
const CommunityFeed = ({ issues = [], isAdmin = false, isLoading = false, onStatusChange, emptyTitle, emptyDesc }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filter & sort
    const feedIssues = issues.filter(i => i.status !== 'rejected');
    const sortedIssues = [...feedIssues].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const totalPages = Math.ceil(sortedIssues.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedIssues = sortedIssues.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <LoadingSpinner size={32} />
            </div>
        );
    }

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
                        <ComplaintCard
                            key={issue.id}
                            issue={issue}
                            isAdmin={isAdmin}
                            onStatusChange={onStatusChange}
                            index={idx}
                        />
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 glass !p-3 !rounded-[16px]">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-2 py-2 px-4 rounded-xl text-[0.85rem] font-bold transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-50 border border-slate-100' : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-[0.85rem] text-slate-500 font-medium">
                        Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
