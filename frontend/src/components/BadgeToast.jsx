import React, { useEffect, useState } from 'react';

/**
 * BadgeToast — animated toast that fires when newly_earned_badges is non-empty.
 *
 * Usage: <BadgeToast badges={newly_earned_badges} />
 * Where `badges` is the array returned by the API: [{ slug, name, emoji, description }, ...]
 */
const BadgeToast = ({ badges = [] }) => {
    const [visible, setVisible] = useState([]);

    useEffect(() => {
        if (!badges || badges.length === 0) return;

        // Add new badges to the visible stack
        const withIds = badges.map((b, i) => ({
            ...b,
            _id: `${b.slug}-${Date.now()}-${i}`,
        }));

        setVisible(prev => [...prev, ...withIds]);

        // Auto-dismiss each after 5s
        withIds.forEach(badge => {
            setTimeout(() => {
                setVisible(prev => prev.filter(b => b._id !== badge._id));
            }, 5000);
        });
    }, [badges]);

    if (visible.length === 0) return null;

    return (
        <div className="badge-toast-container" aria-live="polite">
            {visible.map(badge => (
                <div key={badge._id} className="badge-toast">
                    <button
                        className="badge-toast-close"
                        onClick={() => setVisible(prev => prev.filter(b => b._id !== badge._id))}
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                    <div className="badge-toast-emoji">{badge.emoji}</div>
                    <div className="badge-toast-body">
                        <div className="badge-toast-title">Badge Unlocked! 🎉</div>
                        <div className="badge-toast-name">{badge.name}</div>
                        <div className="badge-toast-desc">{badge.description}</div>
                    </div>
                    <div className="badge-toast-progress" />
                </div>
            ))}
        </div>
    );
};

export default BadgeToast;
