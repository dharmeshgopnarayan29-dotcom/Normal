import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Filter, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const createColoredIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 16px; height: 16px; border-radius: 50%;
            background: ${color}; border: 2.5px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10],
    });
};

const priorityColors = {
    pending: '#ef4444',     // Immediate (Red)
    in_progress: '#f97316', // High (Orange)
    verified: '#eab308',    // Medium (Yellow)
    resolved: '#22c55e',    // Low/Resolved (Green)
    rejected: '#6b7280',
};

// Haversine distance calculation
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        0.5 - Math.cos(dLat)/2 + 
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        (1 - Math.cos(dLon))/2;
    return R * 2 * Math.asin(Math.sqrt(a));
};

const UpdateMapCenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 13);
    }, [center, map]);
    return null;
};

const MapView = ({ issues, isAdmin = false, onStatusChange, userLocation }) => {
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterRadius, setFilterRadius] = useState(5); // Default 5km radius

    // Calculate distances and apply filters
    const issuesWithDistance = issues.map(iss => {
        const distance = userLocation ? getDistance(userLocation.lat, userLocation.lng, parseFloat(iss.lat), parseFloat(iss.lng)) : null;
        return { ...iss, distance };
    });

    const filteredIssues = issuesWithDistance.filter(iss => {
        if (filterStatus !== 'all' && iss.status !== filterStatus) return false;
        if (filterRadius !== 'all' && iss.distance !== null && iss.distance > filterRadius) return false;
        return true;
    });

    const center = userLocation ? [userLocation.lat, userLocation.lng] : (issues.length > 0 ? [parseFloat(issues[0].lat), parseFloat(issues[0].lng)] : [28.6139, 77.2090]);

    const statusCounts = {
        total: filteredIssues.length,
        pending: filteredIssues.filter(i => i.status === 'pending').length,
        in_progress: filteredIssues.filter(i => i.status === 'in_progress').length,
        resolved: filteredIssues.filter(i => i.status === 'resolved').length,
    };
    
    // Determine Area Status
    const areaStatus = statusCounts.pending > 5 ? 'high' : 'good';

    return (
        <div>
            <div className="map-view-layout">
                {/* Map */}
                <div className="glass !p-0 overflow-hidden relative border border-slate-200 rounded-custom shadow-sm">
                    <div className="py-5 px-6 border-b border-slate-200 bg-white">
                        <h3 className="text-[1.1rem] font-bold text-slate-900">Complaint Locations</h3>
                    </div>
                    <div className="h-[550px] relative">
                        <MapContainer center={center} zoom={13} className="h-full w-full z-[1]">
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                            <UpdateMapCenter center={center} />
                            {userLocation && (
                                <Marker position={[userLocation.lat, userLocation.lng]} icon={createColoredIcon('#8b5cf6')}>
                                    <Popup><b>You are here</b><br/>{userLocation.name}</Popup>
                                </Marker>
                            )}
                            {filteredIssues.map(iss => (
                                <Marker
                                    key={iss.id}
                                    position={[parseFloat(iss.lat), parseFloat(iss.lng)]}
                                    icon={createColoredIcon(priorityColors[iss.status] || '#6b7280')}
                                    eventHandlers={{ click: () => setSelectedIssue(iss) }}
                                >
                                    <Popup>
                                        <b>{iss.title}</b><br/>
                                        {iss.distance !== null && <span className="text-[0.8rem] text-[#666]">{iss.distance.toFixed(1)} km away<br/></span>}
                                        <span className={`badge ${iss.status}`}>{iss.status.replace('_', ' ')}</span>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Floating CTA */}
                        {!isAdmin && (
                            <button className="btn-primary absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] py-3 px-6 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                                <Plus size={18} /> Report Issue Near Me
                            </button>
                        )}

                        {/* Priority Legend */}
                        <div className="priority-legend absolute bottom-5 left-5 z-[400] bg-slate-100/90 rounded-[16px] p-4 border border-slate-200 shadow-md backdrop-blur-sm">
                            <h4 className="text-[0.85rem] font-bold mb-2.5 text-slate-900">Priority Levels</h4>
                            <div className="legend-item"><div className="legend-dot bg-red-500"></div> Immediate</div>
                            <div className="legend-item"><div className="legend-dot bg-orange-500"></div> High</div>
                            <div className="legend-item"><div className="legend-dot bg-yellow-500"></div> Medium</div>
                            <div className="legend-item"><div className="legend-dot bg-green-500"></div> Low</div>
                        </div>
                    </div>
                </div>

                {/* Side Panel */}
                <div className="map-panel flex flex-col gap-6">
                    
                    {/* Area Summary / Nearby Insights Panel */}
                    <div className="area-summary bg-slate-100 border border-slate-200 rounded-custom p-6 shadow-sm">
                        <h3 className="text-[1.1rem] font-bold mb-5 text-slate-900">
                            Nearby Insights {userLocation && <span className="font-normal opacity-70 text-[0.85rem]"><br/>({userLocation.name})</span>}
                        </h3>
                        
                        <div className={`flex items-center gap-2.5 p-3 rounded-xl mb-6 border ${areaStatus === 'high' ? 'bg-red-500/15 border-red-500/30' : 'bg-green-500/15 border-green-500/30'}`}>
                            {areaStatus === 'high' ? <AlertCircle size={20} color="#fca5a5" /> : <CheckCircle2 size={20} color="#86efac" />}
                            <span className={`text-[0.9rem] font-semibold ${areaStatus === 'high' ? 'text-[#fca5a5]' : 'text-[#86efac]'}`}>
                                {areaStatus === 'high' ? '⚠️ High issue activity in your area' : '✅ Area is mostly resolved'}
                            </span>
                        </div>

                        <div className="summary-row py-2.5 border-b border-slate-100">
                            <span className="label text-slate-500">Total Nearby:</span>
                            <span className="value font-extrabold text-[1.1rem] text-blue-600">{statusCounts.total}</span>
                        </div>
                        <div className="summary-row py-2.5 border-b border-slate-100">
                            <span className="label text-slate-500">Immediate:</span>
                            <span className="value font-extrabold text-[1.1rem] text-red-600">{statusCounts.pending}</span>
                        </div>
                        <div className="summary-row py-2.5 border-b border-slate-100">
                            <span className="label text-slate-500">Pending:</span>
                            <span className="value font-extrabold text-[1.1rem] text-orange-500">{statusCounts.in_progress}</span>
                        </div>
                        <div className="summary-row py-2.5">
                            <span className="label text-slate-500">Resolved:</span>
                            <span className="value font-extrabold text-[1.1rem] text-green-600">{statusCounts.resolved}</span>
                        </div>
                    </div>

                    {/* Selected Complaint Detail */}
                    <div className="detail-panel bg-slate-100 border border-slate-200 rounded-custom p-6 shadow-sm flex-1">
                        {selectedIssue ? (
                            <div className="text-left">
                                <h3 className="text-[1.25rem] font-bold mb-3 text-slate-900">{selectedIssue.title}</h3>
                                
                                {selectedIssue.distance !== null && (
                                    <div className="inline-block bg-slate-100 py-1 px-2.5 rounded-full text-[0.8rem] font-semibold text-slate-700 mb-4">
                                        📍 {selectedIssue.distance.toFixed(1)} km away
                                    </div>
                                )}
                                
                                <p className="text-[0.95rem] text-slate-600 leading-relaxed mb-6">
                                    {selectedIssue.description}
                                </p>
                                
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                                    <span className={`badge ${selectedIssue.status}`}>{selectedIssue.status.replace('_', ' ')}</span>
                                    <span className="badge-category bg-slate-100 py-1 px-2.5 rounded-full text-slate-600 text-[0.8rem]">{selectedIssue.category}</span>
                                </div>
                                
                                <p className="text-[0.85rem] text-slate-500">
                                    Reported by: <strong className="text-slate-900">{selectedIssue.reporter_name || 'Unknown'}</strong><br/>
                                    Time: <strong className="text-slate-900">{new Date(selectedIssue.created_at).toLocaleString()}</strong>
                                </p>

                                {isAdmin && onStatusChange && (
                                    <select
                                        className="select-field mt-6 w-full bg-white text-slate-900 p-3 rounded-xl border border-slate-300"
                                        value={selectedIssue.status}
                                        onChange={(e) => {
                                            onStatusChange(selectedIssue.id, e.target.value);
                                            setSelectedIssue({ ...selectedIssue, status: e.target.value });
                                        }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="verified">Verified</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state py-12 text-center">
                                <MapPin size={48} className="text-slate-300 mx-auto mb-4" />
                                <h3 className="text-[1.1rem] font-bold text-slate-700 mb-2">Select a Complaint</h3>
                                <p className="text-[0.9rem] text-slate-500">Click on a pin in the map to view detailed information</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar flex gap-4 mt-6 bg-slate-100 py-4 px-6 rounded-[20px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="filter-label text-slate-700 font-bold">
                        <MapPin size={18} />
                        <span>Nearby Filter:</span>
                    </div>
                    <select className="select-field w-[120px] py-2 px-3 bg-white text-slate-900 rounded-xl border border-slate-300" value={filterRadius} onChange={(e) => setFilterRadius(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                        <option value="1">1 km</option>
                        <option value="3">3 km</option>
                        <option value="5">5 km</option>
                        <option value="10">10 km</option>
                        <option value="all">All Issues</option>
                    </select>
                </div>

                <div className="w-px bg-slate-200 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className="filter-label text-slate-700 font-bold">
                        <Filter size={18} />
                        <span>Status:</span>
                    </div>
                    <select className="select-field w-[150px] py-2 px-3 bg-white text-slate-900 rounded-xl border border-slate-300" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default MapView;
