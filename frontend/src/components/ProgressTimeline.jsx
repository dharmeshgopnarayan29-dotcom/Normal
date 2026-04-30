import React, { useState, useEffect } from 'react';
import { Check, X, Circle, Clock, UserCheck, Wrench, CheckCircle2, Send, AlertTriangle } from 'lucide-react';

const TIMELINE_STEPS = [
    { key: 'submitted', label: 'Submitted', icon: Send, description: 'Complaint filed' },
    { key: 'verified', label: 'Verified', icon: UserCheck, description: 'Confirmed by admin' },
    { key: 'assigned', label: 'Assigned', icon: Wrench, description: 'Assigned to department' },
    { key: 'in_progress', label: 'In Progress', icon: Clock, description: 'Work has started' },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle2, description: 'Issue fixed' },
];

const getStepIndex = (step) => {
    const idx = TIMELINE_STEPS.findIndex(s => s.key === step);
    return idx >= 0 ? idx : -1;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ── Mini Timeline (compact, for cards) ──
export const MiniTimeline = ({ timeline, status }) => {
    const isRejected = status === 'rejected';
    const rejectedEvent = isRejected ? timeline?.find(e => e.step === 'rejected') : null;

    // Determine current step index from timeline events
    const completedSteps = new Set((timeline || []).map(e => e.step));
    let currentStepIdx = -1;
    TIMELINE_STEPS.forEach((s, i) => {
        if (completedSteps.has(s.key)) currentStepIdx = i;
    });

    return (
        <div className="mini-timeline">
            {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isUpcoming = idx > currentStepIdx;

                return (
                    <React.Fragment key={step.key}>
                        <div className={`mini-timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            <div className={`mini-timeline-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                {isCompleted ? <Check size={8} strokeWidth={3} /> : null}
                            </div>
                            <span className="mini-timeline-label">{step.label}</span>
                        </div>
                        {idx < TIMELINE_STEPS.length - 1 && (
                            <div className={`mini-timeline-line ${isCompleted && idx < currentStepIdx ? 'completed' : ''}`} />
                        )}
                    </React.Fragment>
                );
            })}
            {isRejected && (
                <div className="mini-timeline-rejected">
                    <X size={10} strokeWidth={3} />
                    <span>Rejected</span>
                </div>
            )}
        </div>
    );
};

// ── Full Timeline (detailed, expandable) ──
const ProgressTimeline = ({ timeline, status, variant = 'vertical' }) => {
    const [mounted, setMounted] = useState(false);
    const isRejected = status === 'rejected';
    const isResolved = status === 'resolved';

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Build event map: step → event data
    const eventMap = {};
    (timeline || []).forEach(e => {
        if (!eventMap[e.step] || new Date(e.created_at) > new Date(eventMap[e.step].created_at)) {
            eventMap[e.step] = e;
        }
    });

    // Determine current step index
    let currentStepIdx = -1;
    TIMELINE_STEPS.forEach((s, i) => {
        if (eventMap[s.key]) currentStepIdx = i;
    });

    const rejectedEvent = eventMap['rejected'];

    return (
        <div className={`progress-timeline ${variant} ${mounted ? 'mounted' : ''}`}>
            {TIMELINE_STEPS.map((step, idx) => {
                const event = eventMap[step.key];
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx && !isResolved;
                const isUpcoming = idx > currentStepIdx;
                const IconComponent = step.icon;
                const delay = idx * 0.15;

                return (
                    <div
                        key={step.key}
                        className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isUpcoming ? 'upcoming' : ''}`}
                        style={{ animationDelay: `${delay}s` }}
                    >
                        {/* Connector line (before this step) */}
                        {idx > 0 && (
                            <div className={`timeline-connector ${isCompleted ? 'completed' : ''}`}
                                 style={{ animationDelay: `${delay - 0.07}s` }}
                            />
                        )}

                        {/* Step circle */}
                        <div className={`timeline-circle ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            {isCompleted ? (
                                isResolved && idx === currentStepIdx ?
                                    <CheckCircle2 size={16} strokeWidth={2.5} /> :
                                    <Check size={14} strokeWidth={3} />
                            ) : (
                                <IconComponent size={14} />
                            )}
                        </div>

                        {/* Step content */}
                        <div className="timeline-content">
                            <div className="timeline-step-title">{step.label}</div>
                            {event ? (
                                <>
                                    <div className="timeline-step-time">{formatDate(event.created_at)}</div>
                                    {event.performed_by_name && (
                                        <div className="timeline-step-actor">
                                            {step.key === 'submitted' ? `Submitted by ${event.performed_by_name}` :
                                             step.key === 'assigned' ? `Assigned to ${event.department || 'department'}` :
                                             `${step.label} by ${event.performed_by_name}`}
                                        </div>
                                    )}
                                    {event.note && (
                                        <div className="timeline-step-note">"{event.note}"</div>
                                    )}
                                </>
                            ) : (
                                <div className="timeline-step-pending">{step.description}</div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Rejected step (special) */}
            {isRejected && rejectedEvent && (
                <div className="timeline-step rejected" style={{ animationDelay: `${TIMELINE_STEPS.length * 0.15}s` }}>
                    <div className="timeline-connector rejected" />
                    <div className="timeline-circle rejected">
                        <X size={14} strokeWidth={3} />
                    </div>
                    <div className="timeline-content">
                        <div className="timeline-step-title rejected-title">Rejected</div>
                        <div className="timeline-step-time">{formatDate(rejectedEvent.created_at)}</div>
                        {rejectedEvent.performed_by_name && (
                            <div className="timeline-step-actor">Rejected by {rejectedEvent.performed_by_name}</div>
                        )}
                        {rejectedEvent.note && (
                            <div className="timeline-step-note rejected-note">"{rejectedEvent.note}"</div>
                        )}
                    </div>
                </div>
            )}

            {/* Resolved celebration */}
            {isResolved && mounted && (
                <div className="timeline-resolved-badge">
                    🎉 Issue Resolved!
                </div>
            )}
        </div>
    );
};

export default ProgressTimeline;
