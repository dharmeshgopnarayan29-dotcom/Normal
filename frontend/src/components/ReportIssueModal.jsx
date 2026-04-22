import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Camera, Upload, Navigation, Map, CheckCircle2, AlertCircle } from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const LocationPicker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) { setPosition(e.latlng); },
    });
    return position ? <Marker position={position} /> : null;
};

// Handles flyTo + invalidateSize when map becomes visible or center changes
const MapController = ({ mapCenter, shouldInvalidate }) => {
    const map = useMap();
    useEffect(() => {
        if (mapCenter) {
            // Small delay to let CSS transition finish before flying
            const timer = setTimeout(() => {
                map.invalidateSize();
                map.flyTo(mapCenter, 16, { duration: 0.8 });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [mapCenter, map]);

    // Re-invalidate when the container resizes (expand/collapse animation)
    useEffect(() => {
        if (shouldInvalidate) {
            const timer = setTimeout(() => map.invalidateSize(), 350);
            return () => clearTimeout(timer);
        }
    }, [shouldInvalidate, map]);

    return null;
};

const DEFAULT_CENTER = [28.6139, 77.2090];

const ReportIssueModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ title: '', description: '', category: 'roads' });
    const [address, setAddress] = useState('');
    const [position, setPosition] = useState(null);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [photo, setPhoto] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [mapReady, setMapReady] = useState(false); // tracks if map has been mounted at least once
    const [locationStatus, setLocationStatus] = useState(null); // 'detecting' | 'success' | 'error'
    const [locationError, setLocationError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [mapLocationError, setMapLocationError] = useState('');
    const mapInvalidateKey = useRef(0);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({ title: '', description: '', category: 'roads' });
            setAddress('');
            setPosition(null);
            setMapCenter(DEFAULT_CENTER);
            setPhoto(null);
            setShowMap(false);
            setMapReady(false);
            setLocationStatus(null);
            setLocationError('');
            setSubmitError('');
            setMapLocationError('');
        }
    }, [isOpen]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Reverse geocode helper
    const reverseGeocode = async (lat, lng) => {
        try {
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'User-Agent': 'CivicFix/1.0' } }
            );
            const data = await resp.json();
            if (data.display_name) return data.display_name;
        } catch (err) { /* silent */ }
        return '';
    };

    const handleGetLocation = () => {
        if (!("geolocation" in navigator)) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }
        setLocationStatus('detecting');
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(latlng);
                setMapCenter([latlng.lat, latlng.lng]);
                setLocationStatus('success');
                setSubmitError('');

                const resolved = await reverseGeocode(latlng.lat, latlng.lng);
                if (resolved) setAddress(resolved);
            },
            () => {
                setLocationStatus('error');
                setLocationError("Location access denied. Please enter the address manually or select on the map.");
            }
        );
    };

    // "Show Map" button handler — requests location, centers map, then reveals it
    const handleToggleMap = () => {
        if (showMap) {
            // Collapsing
            setShowMap(false);
            setMapLocationError('');
            return;
        }

        // Expanding — determine the best center
        setMapLocationError('');

        // Priority: 1) existing position, 2) request device location, 3) fallback
        if (position) {
            setMapCenter([position.lat, position.lng]);
            setShowMap(true);
            setMapReady(true);
            mapInvalidateKey.current += 1;
            return;
        }

        // Try to get current location for centering
        if ("geolocation" in navigator) {
            setLocationStatus('detecting');
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setPosition(latlng);
                    setMapCenter([latlng.lat, latlng.lng]);
                    setLocationStatus('success');
                    setSubmitError('');
                    setShowMap(true);
                    setMapReady(true);
                    mapInvalidateKey.current += 1;

                    const resolved = await reverseGeocode(latlng.lat, latlng.lng);
                    if (resolved) setAddress(resolved);
                },
                () => {
                    // Location denied — still open map with default center
                    setLocationStatus(null);
                    setMapLocationError("Couldn't access your current location. Please select the issue location manually on the map.");
                    setShowMap(true);
                    setMapReady(true);
                    mapInvalidateKey.current += 1;
                }
            );
        } else {
            // No geolocation API — open map with default
            setMapLocationError("Geolocation is not available. Please select the issue location manually on the map.");
            setShowMap(true);
            setMapReady(true);
            mapInvalidateKey.current += 1;
        }
    };

    // When user picks on map, reverse geocode the point
    const handleMapPick = async (latlng) => {
        setPosition(latlng);
        setLocationStatus('success');
        setSubmitError('');
        setMapLocationError('');
        const resolved = await reverseGeocode(latlng.lat, latlng.lng);
        if (resolved) setAddress(resolved);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitError('');

        const hasAddress = address.trim().length > 0;
        const hasCoords = position !== null;

        if (!hasAddress && !hasCoords) {
            setSubmitError("Please provide an address, use your current location, or select a location on the map.");
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        if (photo) data.append('photo', photo);

        if (hasAddress) data.append('address', address.trim());
        if (hasCoords) {
            data.append('lat', position.lat.toFixed(6));
            data.append('lng', position.lng.toFixed(6));
        }

        onSubmit(data);
        setFormData({ title: '', description: '', category: 'roads' });
        setAddress('');
        setPosition(null);
        setPhoto(null);
        setShowMap(false);
        setMapReady(false);
        setLocationStatus(null);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Report a New Issue</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="modal-body flex flex-col gap-4">

                        {/* Title */}
                        <div className="form-group !mb-0">
                            <label className="text-slate-700 font-bold mb-2">Issue Title</label>
                            <input className="input-field" placeholder="e.g. Large Pothole on Main Street" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                        </div>

                        {/* Description */}
                        <div className="form-group !mb-0">
                            <label className="text-slate-700 font-bold mb-2">Description</label>
                            <textarea className="textarea-field resize-none" rows="3" placeholder="Describe the issue in detail..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                        </div>

                        {/* Category & Photo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="form-group !mb-0">
                                <label className="text-slate-700 font-bold mb-2">Category</label>
                                <select className="select-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    <option value="roads">Roads</option>
                                    <option value="sanitation">Sanitation</option>
                                    <option value="water">Water</option>
                                    <option value="electricity">Electricity</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group !mb-0">
                                <label className="text-slate-700 font-bold mb-2">Photo (optional)</label>
                                <div className="relative w-full">
                                    <input type="file" id="photo-upload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
                                    <div className="flex items-center gap-2 w-full py-2.5 px-3.5 border border-gray-300 rounded-custom-sm text-[0.9rem] text-gray-600 bg-white transition-all duration-200 hover:bg-gray-50 hover:border-black">
                                        <Camera size={18} className="text-black shrink-0" />
                                        <span className="truncate">{photo ? photo.name : 'Upload an image...'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Location Section ── */}
                        <div className="form-group !mb-0">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin size={18} className="text-black" />
                                <label className="text-black font-bold text-[0.95rem] !mb-0">Location / Address of the Issue</label>
                            </div>
                            <p className="text-gray-500 text-[0.8rem] mb-3 leading-relaxed">
                                You can type the issue address even if you are not there, use your current device location, or pick the spot directly on the map.
                            </p>

                            {/* Address Input */}
                            <input
                                className="input-field mb-3"
                                placeholder="e.g. Near Main Road, 5th Cross, BTM Layout"
                                value={address}
                                onChange={e => { setAddress(e.target.value); setSubmitError(''); }}
                            />

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    disabled={locationStatus === 'detecting'}
                                    className="flex items-center gap-1.5 py-2 px-3.5 text-[0.8rem] font-bold rounded-xl border border-gray-200 bg-gray-50 text-black cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    <Navigation size={14} />
                                    {locationStatus === 'detecting' ? 'Detecting...' : 'Use My Location'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleToggleMap}
                                    disabled={locationStatus === 'detecting'}
                                    className={`flex items-center gap-1.5 py-2 px-3.5 text-[0.8rem] font-bold rounded-xl border cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-wait ${showMap ? 'bg-black text-white border-black' : 'bg-gray-50 text-black border-gray-200 hover:bg-gray-100 hover:border-gray-300'}`}
                                >
                                    <Map size={14} />
                                    {showMap ? 'Hide Map' : 'Show Map'}
                                </button>
                            </div>

                            {/* Location Status Messages */}
                            {locationStatus === 'success' && (
                                <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 text-[0.8rem] font-medium mb-3">
                                    <CheckCircle2 size={14} className="shrink-0" /> Current location detected successfully
                                </div>
                            )}
                            {locationStatus === 'error' && locationError && (
                                <div className="flex items-start gap-2 py-2 px-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 text-[0.8rem] font-medium mb-3">
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" /> {locationError}
                                </div>
                            )}
                            {mapLocationError && showMap && (
                                <div className="flex items-start gap-2 py-2 px-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-600 text-[0.8rem] font-medium mb-3">
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" /> {mapLocationError}
                                </div>
                            )}

                            {/* Map (Collapsible, large when visible) */}
                            <div
                                className={`rounded-[16px] overflow-hidden border border-slate-200 shadow-inner transition-all duration-300 ease-in-out ${showMap ? 'h-[280px] sm:h-[340px] opacity-100 mb-1' : 'h-0 opacity-0 border-transparent shadow-none'}`}
                            >
                                {mapReady && (
                                    <MapContainer center={mapCenter} zoom={16} className="h-full w-full z-[1]">
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                        <MapController mapCenter={mapCenter} shouldInvalidate={mapInvalidateKey.current} />
                                        <LocationPicker position={position} setPosition={handleMapPick} />
                                    </MapContainer>
                                )}
                            </div>

                            {/* Coordinates indicator when position is set */}
                            {position && (
                                <div className="flex items-center gap-2 mt-2 py-1.5 px-3 rounded-lg bg-gray-50 border border-gray-200 text-[0.75rem] text-gray-500 font-mono">
                                    <MapPin size={12} className="text-black shrink-0" />
                                    {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                                </div>
                            )}
                        </div>

                        {/* Submit Error */}
                        {submitError && (
                            <div className="flex items-start gap-2 py-2.5 px-3.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 text-[0.85rem] font-medium">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {submitError}
                            </div>
                        )}

                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">
                            <Upload size={16} /> Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportIssueModal;
