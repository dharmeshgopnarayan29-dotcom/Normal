import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import { MapPin } from 'lucide-react';
import api from '../api';

const CitizenMapView = () => {
    const [issues, setIssues] = useState([]);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const res = await api.get('issues/');
                setIssues(res.data);
            } catch (err) {
                console.error('Failed to fetch', err);
            }
        };
        fetchIssues();
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await res.json();
                        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Location';
                        const suburb = data.address?.suburb || data.address?.neighbourhood || '';
                        const name = suburb ? `${suburb}, ${city}` : city;
                        setUserLocation({ lat, lng, name });
                    } catch (error) {
                        setUserLocation({ lat, lng, name: 'Your Location' });
                    }
                },
                (error) => {
                    console.log('Geolocation failed or denied. Using default location (Whitefield).');
                    setUserLocation({ lat: 12.9698, lng: 77.7499, name: 'Whitefield, Bangalore' });
                }
            );
        } else {
            setUserLocation({ lat: 12.9698, lng: 77.7499, name: 'Whitefield, Bangalore' });
        }
    }, []);

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container-wide">
                <div className="page-header flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-[2rem] font-extrabold text-slate-900">Map View</h1>
                        <p className="subtitle text-slate-500">Geographic distribution of complaints in your area</p>
                    </div>
                    {userLocation && (
                        <div className="inline-flex items-center gap-2 bg-white/[0.08] py-2.5 px-5 rounded-full  border border-slate-200 shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
                            <MapPin size={18} color="#86efac" />
                            <span className="font-semibold text-slate-900 text-[0.95rem]">{userLocation.name}</span>
                        </div>
                    )}
                </div>
                <MapView issues={issues} isAdmin={false} userLocation={userLocation} />
            </div>
        </div>
    );
};

export default CitizenMapView;
