import React from 'react';

const StatsBar = ({ stats }) => {
    return (
        <div className="stats-grid">
            {stats.map((stat, index) => (
                <div key={index} className={`stat-card ${stat.bgColor || ''}`} style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="stat-icon" style={{ color: stat.color || 'white', background: `linear-gradient(135deg, ${stat.color}33, transparent)`, border: `1px solid ${stat.color}44` }}>
                        {stat.icon}
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsBar;
