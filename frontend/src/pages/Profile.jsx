import React, { useContext, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Shield, LogOut, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BadgeShowcase from '../components/BadgeShowcase';
import api from '../api';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [karma, setKarma] = useState(null);

    useEffect(() => {
        // Fetch karma from badge endpoint (it's already fetched by BadgeShowcase,
        // but we also expose it here via a separate lightweight call)
        api.get('users/profile/karma/')
            .then(res => setKarma(res.data.karma))
            .catch(() => setKarma(null));
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container max-w-[700px]">
                <div className="page-header">
                    <h1>My Profile</h1>
                    <p className="subtitle">Your account, karma & badges</p>
                </div>

                {/* Profile card */}
                <div className="profile-card mb-6">
                    <div className="profile-avatar">
                        {(user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-[1.25rem] font-semibold mb-1">{user?.username || user?.email}</h2>
                    <span className={`badge ${user?.role === 'admin' ? 'verified' : 'pending'} mb-4`}>
                        {user?.role}
                    </span>

                    {/* Karma pill */}
                    {karma !== null && (
                        <div className="karma-pill">
                            <Star size={14} fill="currentColor" />
                            <span><strong>{karma}</strong> karma points</span>
                        </div>
                    )}

                    <div className="text-left mt-6">
                        <div className="flex items-center gap-3 py-4 border-b border-slate-200">
                            <Mail size={20} color="#6b7280" />
                            <div>
                                <div className="text-[0.8rem] text-gray-500">Email</div>
                                <div className="text-[0.95rem] font-medium">{user?.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 py-4 border-b border-slate-200">
                            <Shield size={20} color="#6b7280" />
                            <div>
                                <div className="text-[0.8rem] text-gray-500">Role</div>
                                <div className="text-[0.95rem] font-medium capitalize">{user?.role}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 py-4">
                            <Star size={20} color="#6b7280" />
                            <div>
                                <div className="text-[0.8rem] text-gray-500">Karma Points</div>
                                <div className="text-[0.95rem] font-bold text-black">{karma ?? '—'}</div>
                            </div>
                        </div>
                    </div>

                    <button className="btn-primary mt-8 w-full" onClick={handleLogout}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>

                {/* Badge showcase — full grid */}
                <BadgeShowcase />
            </div>
        </div>
    );
};

export default Profile;
