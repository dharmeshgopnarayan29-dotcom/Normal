import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import api from '../api';
import { AlertTriangle } from 'lucide-react';

const AdminMapView = () => {
    const [issues, setIssues] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [geoError, setGeoError] = useState('');

    useEffect(() => { fetchData(); }, []);

    // Detect admin location on mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        name: 'Your Location',
                    });
                },
                () => {
                    setGeoError("Couldn't access your current location. Showing default map area.");
                },
                { timeout: 8000 }
            );
        }
    }, []);

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

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container-wide">
                <div className="page-header">
                    <h1>Map View</h1>
                    <p className="subtitle">Geographic distribution of complaints</p>
                </div>
                {geoError && (
                    <div className="flex items-center gap-2 py-2 px-4 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[0.8rem] font-medium">
                        <AlertTriangle size={14} className="shrink-0" /> {geoError}
                    </div>
                )}
                <MapView issues={issues} isAdmin={true} onStatusChange={updateStatus} userLocation={userLocation} />
            </div>
        </div>
    );
};

export default AdminMapView;
