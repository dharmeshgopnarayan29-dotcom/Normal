import React, { useContext } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container max-w-[600px]">
                <div className="page-header">
                    <h1>My Profile</h1>
                    <p className="subtitle">Manage your account settings</p>
                </div>

                <div className="profile-card">
                    <div className="profile-avatar">
                        {(user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-[1.25rem] font-semibold mb-1">{user?.email}</h2>
                    <span className={`badge ${user?.role === 'admin' ? 'verified' : 'pending'} mb-6`}>
                        {user?.role}
                    </span>

                    <div className="text-left mt-6">
                        <div className="flex items-center gap-3 py-4 border-b border-slate-200">
                            <Mail size={20} color="var(--text-light)" />
                            <div>
                                <div className="text-[0.8rem] text-slate-500">Email</div>
                                <div className="text-[0.95rem] font-medium">{user?.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 py-4 border-b border-slate-200">
                            <Shield size={20} color="var(--text-light)" />
                            <div>
                                <div className="text-[0.8rem] text-slate-500">Role</div>
                                <div className="text-[0.95rem] font-medium capitalize">{user?.role}</div>
                            </div>
                        </div>
                    </div>

                    <button className="btn-primary mt-8 w-full !bg-danger" onClick={handleLogout}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
