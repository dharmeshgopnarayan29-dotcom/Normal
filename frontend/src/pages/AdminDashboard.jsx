import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import CommunityFeed from '../components/CommunityFeed';
import api from '../api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Clock, Users, CheckCircle2, ArrowUpRight, Minus, Filter, MapPin } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const adminLocationIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="
        width: 14px; height: 14px; border-radius: 50%;
        background: #000000; border: 3px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
});

// Watches for adminLocation and flies to it once available
const MapLocationUpdater = ({ adminLocation, fallbackCenter, zoom }) => {
    const map = useMap();
    const hasFlown = useRef(false);

    useEffect(() => {
        if (adminLocation && !hasFlown.current) {
            hasFlown.current = true;
            map.flyTo([adminLocation.lat, adminLocation.lng], zoom, { duration: 1.2 });
        }
    }, [adminLocation, zoom, map]);

    // On mount, if no adminLocation yet, just make sure tiles render
    useEffect(() => {
        map.invalidateSize();
    }, [map]);

    return null;
};

const DEFAULT_CENTER = [28.6139, 77.2090];

const AdminDashboard = () => {
    const [issues, setIssues] = useState([]);
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [adminLocation, setAdminLocation] = useState(null);
    const [geoError, setGeoError] = useState('');
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setAdminLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {
                    setGeoError("Couldn't access your current location. Showing default map area.");
                },
                { timeout: 8000 }
            );
        }
    }, []);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('issues/');
            setIssues(res.data);
        } catch (err) {
            console.error('Failed to fetch issues', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        setUpdatingId(id);
        try {
            await api.patch(`issues/${id}/`, { status });
            fetchData();
            if (selectedIssueId === id) setSelectedIssueId(null);
        } catch (err) {
            alert('Status update failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteIssue = (id) => {
        setIssues(prev => prev.filter(i => i.id !== id));
        if (selectedIssueId === id) setSelectedIssueId(null);
    };

    const immediateCount = issues.filter(i => i.status === 'rejected').length;
    const pendingCount = issues.filter(i => i.status === 'pending').length;
    const assignedCount = issues.filter(i => i.status === 'in_progress' || i.status === 'verified').length;
    const completedCount = issues.filter(i => i.status === 'resolved').length;

    const stats = [
        { icon: <AlertTriangle size={24} />, value: immediateCount, label: 'Immediate', color: '#000000', trend: '+2', trendType: 'negative', bgColor: 'bg-white border-gray-200' },
        { icon: <Clock size={24} />, value: pendingCount, label: 'Pending', color: '#374151', trend: '-5%', trendType: 'positive', bgColor: 'bg-white border-gray-200' },
        { icon: <Users size={24} />, value: assignedCount, label: 'Active', color: '#374151', trend: '+12%', trendType: 'positive', bgColor: 'bg-white border-gray-200' },
        { icon: <CheckCircle2 size={24} />, value: completedCount, label: 'Completed', color: '#000000', trend: '+8%', trendType: 'positive', bgColor: 'bg-white border-gray-200' },
    ];

    const effectiveCenter = adminLocation
        ? [adminLocation.lat, adminLocation.lng]
        : issues.length > 0
            ? [parseFloat(issues[0].lat), parseFloat(issues[0].lng)]
            : DEFAULT_CENTER;

    const displayedIssues = filter === 'all' ? issues : issues.filter(i => i.status === filter);
    const selectedIssue = issues.find(i => i.id === selectedIssueId);

    return (
        <div className="dashboard-bg">
            <Navbar />
            {/* ── Main 2-Column Split ── */}
            <div className="max-w-[1600px] mx-auto pt-[100px] px-4 sm:px-6 pb-8 relative z-10 page-transition">

                {/* Page Header */}
                <div className="page-header !mb-6">
                    <h1>Admin Dashboard</h1>
                    <span className="role-badge">Admin</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* LEFT COLUMN — Complaint Management     */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-5">

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {stats.map((stat, index) => (
                                <div key={index} className={`glass-card !p-4 !rounded-[18px] relative overflow-hidden ${stat.bgColor}`} style={{ animationDelay: `${index * 0.05}s` }}>
                                    {stat.trend && (
                                        <div className={`absolute top-3 right-3 flex items-center gap-0.5 text-[0.7rem] font-bold py-0.5 px-1.5 rounded-lg bg-gray-50 text-gray-700`}>
                                            <ArrowUpRight size={10} />{stat.trend}
                                        </div>
                                    )}
                                    <div className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center mb-2 shrink-0" style={{ color: stat.color, background: `linear-gradient(135deg, ${stat.color}33, transparent)`, border: `1px solid ${stat.color}44` }}>
                                        {stat.icon}
                                    </div>
                                    <div className="text-[1.6rem] font-extrabold text-black leading-tight">{stat.value}</div>
                                    <div className="text-[0.75rem] text-gray-500 font-semibold mt-0.5">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Filter Panel */}
                        <div className="glass !p-4 !rounded-[18px] flex items-center justify-between gap-4 flex-wrap bg-white border-gray-200">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 text-black font-semibold text-[0.9rem]">
                                    <Filter size={16} /> Filter Issues
                                </div>
                                <select
                                    className="select-field w-[200px] py-2 px-3 !m-0 text-[0.85rem] bg-white"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="all">View All Issues</option>
                                    <option value="pending">Review Pending</option>
                                    <option value="verified">Verified (Unassigned)</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            {filter !== 'all' && (
                                <div className="flex items-center gap-3">
                                    <span className="text-[0.85rem] text-black">
                                        <strong className="text-black">{displayedIssues.length}</strong> results
                                    </span>
                                    <button className="btn-secondary btn-sm py-1 px-2.5 text-[0.75rem]" onClick={() => setFilter('all')}>
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Complaint Feed */}
                        <CommunityFeed
                            issues={displayedIssues}
                            isAdmin={true}
                            onStatusChange={updateStatus}
                            onRefresh={fetchData}
                            onDelete={deleteIssue}
                            emptyTitle={filter !== 'all' ? "No results found" : "No issues reported yet"}
                            emptyDesc={filter !== 'all' ? `No issues match the "${filter.replace('_', ' ')}" filter.` : "No pending issues to manage."}
                        />
                    </div>

                    {/* RIGHT COLUMN — Map + Issue Details      */}
                    <div className="w-full lg:w-1/2 lg:sticky lg:top-[100px] lg:self-start flex flex-col gap-4 lg:h-[calc(100vh-116px)]">

                        {/* Geo fallback message */}
                        {geoError && (
                            <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[0.8rem] font-medium shrink-0">
                                <AlertTriangle size={14} className="shrink-0" /> {geoError}
                            </div>
                        )}

                        {/* Map Card */}
                        <div className="glass !rounded-[18px] overflow-hidden shrink-0 flex flex-col bg-white border-gray-200 h-[280px] sm:h-[320px] lg:flex-[0_0_38%] lg:h-auto">
                            <div className="py-2.5 px-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                                <MapPin size={16} className="text-black" />
                                <h3 className="text-[0.9rem] font-bold text-black">Live Map</h3>
                                <span className="ml-auto text-[0.7rem] text-gray-500 font-medium">{displayedIssues.length} markers</span>
                            </div>
                            <div className="h-[calc(100%-38px)]">
                                <MapContainer center={DEFAULT_CENTER} zoom={12} className="h-full w-full z-[1]">
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <MapLocationUpdater adminLocation={adminLocation} fallbackCenter={DEFAULT_CENTER} zoom={14} />
                                    {adminLocation && (
                                        <Marker position={[adminLocation.lat, adminLocation.lng]} icon={adminLocationIcon}>
                                            <Popup><b>You are here</b></Popup>
                                        </Marker>
                                    )}
                                    {displayedIssues.map(iss => (
                                        <Marker
                                            key={iss.id}
                                            position={[parseFloat(iss.lat), parseFloat(iss.lng)]}
                                            eventHandlers={{ click: () => setSelectedIssueId(iss.id) }}
                                        >
                                            <Popup><b>{iss.title}</b><br/><span className={`badge ${iss.status}`}>{iss.status.replace('_',' ')}</span></Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        </div>

                        {/* Issue Details Panel — takes remaining ~55% */}
                        <div className="glass !rounded-[18px] overflow-hidden flex-1 min-h-0 flex flex-col bg-white border-gray-200">
                            <div className="py-2.5 px-5 border-b border-gray-100 bg-gray-50 shrink-0 flex items-center justify-between">
                                <h3 className="text-[0.9rem] font-bold text-black">
                                    {selectedIssue ? 'Issue Details' : 'Select an Issue'}
                                </h3>
                                {selectedIssue && (
                                    <span className={`badge ${selectedIssue.status} text-[0.7rem] py-0.5 px-2`}>{selectedIssue.status.replace('_', ' ')}</span>
                                )}
                            </div>
                            <div className="p-5 flex-1">
                                {selectedIssue ? (
                                    <div className="flex flex-col gap-4">
                                        {/* Title */}
                                        <h3 className="text-[1.15rem] font-bold text-black leading-snug">{selectedIssue.title}</h3>

                                        {/* Meta Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                                <div className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider mb-1">Reported By</div>
                                                <div className="text-[0.85rem] font-semibold text-black">{selectedIssue.reporter_name || 'Anonymous'}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                                <div className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider mb-1">Category</div>
                                                <div className="text-[0.85rem] font-semibold text-black capitalize">{selectedIssue.category}</div>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                            <div className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider mb-1">Location</div>
                                            <div className="text-[0.85rem] text-black leading-relaxed">
                                                {selectedIssue.address || (selectedIssue.lat && selectedIssue.lng ? `${selectedIssue.lat}, ${selectedIssue.lng}` : 'Location not available')}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <div className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider mb-2">Description</div>
                                            <p className="text-[0.88rem] leading-[1.7] text-gray-600">{selectedIssue.description}</p>
                                        </div>

                                        {/* Admin Actions */}
                                        <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 mt-auto">
                                            <div className="text-[0.65rem] font-bold text-gray-500 tracking-wider uppercase mb-1">Admin Actions</div>
                                            {selectedIssue.status === 'pending' && (
                                                <button className={`btn-primary p-2.5 text-[0.85rem] justify-center ${updatingId === selectedIssue.id ? 'btn-loading' : ''}`} disabled={updatingId === selectedIssue.id} onClick={() => updateStatus(selectedIssue.id, 'verified')}>
                                                    {updatingId === selectedIssue.id ? <><LoadingSpinner size={16} color="white" /> Approving...</> : 'Approve Issue'}
                                                </button>
                                            )}
                                            {selectedIssue.status === 'verified' && (
                                                <button className={`btn-outline p-2.5 text-[0.85rem] justify-center ${updatingId === selectedIssue.id ? 'btn-loading' : ''}`} disabled={updatingId === selectedIssue.id} onClick={() => updateStatus(selectedIssue.id, 'in_progress')}>
                                                    {updatingId === selectedIssue.id ? <><LoadingSpinner size={16} /> Updating...</> : 'Mark In Progress'}
                                                </button>
                                            )}
                                            {selectedIssue.status === 'in_progress' && (
                                                <button className={`btn-primary p-2.5 text-[0.85rem] justify-center ${updatingId === selectedIssue.id ? 'btn-loading' : ''}`} disabled={updatingId === selectedIssue.id} onClick={() => updateStatus(selectedIssue.id, 'resolved')}>
                                                    {updatingId === selectedIssue.id ? <><LoadingSpinner size={16} color="white" /> Resolving...</> : 'Mark Resolved'}
                                                </button>
                                            )}
                                            <button className="btn-secondary p-2.5 text-[0.85rem] justify-center" onClick={() => setSelectedIssueId(null)}>Close Details</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                                        <MapPin size={40} className="text-gray-300 mb-4" />
                                        <h3 className="text-[1.05rem] font-semibold text-black mb-1.5">No Issue Selected</h3>
                                        <p className="text-[0.85rem] text-gray-500 max-w-[280px] leading-relaxed">Click on a map marker or complaint card to view details and manage the report.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
