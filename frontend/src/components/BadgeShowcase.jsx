import React, { useState } from 'react';
import { useBadges } from '../hooks/useBadges';

const BadgeShowcase = ({ compact = false }) => {
    const [hoveredSlug, setHoveredSlug] = useState(null);

    // ── React Query: badge data cached for 2 minutes ──
    const { data: badgeData, isLoading } = useBadges();

    if (isLoading) {
        return (
            <div className="badge-showcase-loading">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="badge-skeleton" />
                ))}
            </div>
        );
    }

    if (!badgeData) return null;

    const { badges = [], highest_reporter_tier } = badgeData;

    const achievementBadges = badges.filter(b => b.type === 'achievement');
    const tierBadges = badges.filter(b => b.type === 'tier').sort((a, b) => (b.tier_level || 0) - (a.tier_level || 0));
    const highestTier = tierBadges.find(b => b.slug === highest_reporter_tier);

    const earnedCount = badges.filter(b => b.earned).length;
    const totalCount = badges.length;

    if (compact) {
        return (
            <div className="badge-tier-widget">
                {highestTier ? (
                    <div className="badge-tier-display">
                        <span className="badge-tier-emoji">{highestTier.emoji}</span>
                        <div className="badge-tier-info">
                            <div className="badge-tier-name">{highestTier.name}</div>
                            <div className="badge-tier-desc">{highestTier.description}</div>
                        </div>
                    </div>
                ) : (
                    <div className="badge-tier-empty">
                        <span style={{ fontSize: '1.5rem' }}>🏅</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#000' }}>No tier yet</div>
                            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Report 5 issues to earn Bronze</div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="badge-showcase">
            {/* Header with progress bar */}
            <div className="badge-showcase-header">
                <div className="badge-showcase-title">
                    <span style={{ fontSize: '1.4rem' }}>🏆</span>
                    <div>
                        <h3>My Badges</h3>
                        <p>{earnedCount} of {totalCount} earned</p>
                    </div>
                </div>
                <div className="badge-progress-bar">
                    <div
                        className="badge-progress-fill"
                        style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Reporter Tier */}
            <div className="badge-section">
                <h4 className="badge-section-title">🎖️ Reporter Tier</h4>
                <div className="badge-tier-row">
                    {tierBadges.map(badge => (
                        <div
                            key={badge.slug}
                            className={`badge-tier-card ${badge.earned ? 'earned' : 'locked'} ${badge.slug === highest_reporter_tier ? 'active-tier' : ''}`}
                            onMouseEnter={() => setHoveredSlug(badge.slug)}
                            onMouseLeave={() => setHoveredSlug(null)}
                        >
                            <div className="badge-tier-card-emoji">{badge.emoji}</div>
                            <div className="badge-tier-card-name">{badge.name}</div>
                            {badge.earned && badge.earned_at && (
                                <div className="badge-earned-date">
                                    {new Date(badge.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </div>
                            )}
                            {!badge.earned && <div className="badge-lock-icon">🔒</div>}
                            {hoveredSlug === badge.slug && (
                                <div className="badge-tooltip">
                                    <div className="badge-tooltip-name">{badge.emoji} {badge.name}</div>
                                    <div className="badge-tooltip-desc">{badge.description}</div>
                                    {!badge.earned && <div className="badge-tooltip-locked">Not yet earned</div>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Achievement Badges Grid */}
            <div className="badge-section">
                <h4 className="badge-section-title">⭐ Achievement Badges</h4>
                <div className="badge-grid">
                    {achievementBadges.map(badge => (
                        <div
                            key={badge.slug}
                            className={`badge-achievement-card ${badge.earned ? 'earned' : 'locked'}`}
                            onMouseEnter={() => setHoveredSlug(badge.slug)}
                            onMouseLeave={() => setHoveredSlug(null)}
                        >
                            <div className="badge-achievement-emoji">{badge.earned ? badge.emoji : '🔒'}</div>
                            <div className="badge-achievement-name">{badge.name}</div>
                            {badge.earned && badge.earned_at && (
                                <div className="badge-earned-date">
                                    {new Date(badge.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                </div>
                            )}
                            {hoveredSlug === badge.slug && (
                                <div className="badge-tooltip">
                                    <div className="badge-tooltip-name">{badge.emoji} {badge.name}</div>
                                    <div className="badge-tooltip-desc">{badge.description}</div>
                                    {!badge.earned && <div className="badge-tooltip-locked">Not yet earned</div>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BadgeShowcase;
