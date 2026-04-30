import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Home, Bell, FileText, Map, ChevronDown, Menu, X, LayoutDashboard, ClipboardList, Bookmark, BarChart3, FileBarChart, User, Flag } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isAdmin = user?.role === 'admin';

    const citizenNav = [
        { to: '/dashboard', icon: Home, label: 'Home' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
        { to: '/my-complaints', icon: FileText, label: 'My Complaints' },
        { to: '/citizen-map', icon: Map, label: 'Map' },
    ];

    const adminNav = [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/complaints', icon: ClipboardList, label: 'All Complaints' },
        { to: '/admin/saved', icon: Bookmark, label: 'Saved Problems' },
        { to: '/admin/map', icon: Map, label: 'Map View' },
        { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/admin/reports', icon: FileBarChart, label: 'Reports' },
        { to: '/admin/flagged', icon: Flag, label: 'Flagged' },
    ];

    const navItems = isAdmin ? adminNav : citizenNav;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const linkClass = ({ isActive }) =>
        `nav-link${isActive ? ' active' : ''}`;

    return (
        <>
            <nav className="navbar">
                <Link to={isAdmin ? '/admin' : '/dashboard'} className="navbar-brand">
                    Civic<span>Connect</span>
                </Link>

                {/* Desktop Nav */}
                <div className="nav-center">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/dashboard' || item.to === '/admin'}
                            className={linkClass}
                        >
                            <item.icon size={15} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                {/* Profile + Mobile */}
                <div className="nav-right">
                    <div className="relative">
                        <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
                            <div className={`avatar ${isAdmin ? 'admin-avatar' : ''}`}>
                                {(user?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[0.85rem] font-medium text-gray-500">Profile</span>
                            <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {profileOpen && (
                            <div className="profile-dropdown">
                                <div className="py-2 px-[14px] text-[0.8rem] text-gray-500">
                                    {user?.email}
                                </div>
                                <div className="divider" />
                                <Link to={isAdmin ? '/admin' : '/profile'} onClick={() => setProfileOpen(false)}>My Profile</Link>
                                <div className="divider" />
                                <button className="signout" onClick={handleLogout}>Sign Out</button>
                            </div>
                        )}
                    </div>

                    <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Nav */}
            <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/dashboard' || item.to === '/admin'}
                        className={linkClass}
                        onClick={() => setMobileOpen(false)}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
                <button className="nav-link text-black" onClick={handleLogout}>
                    Sign Out
                </button>
            </div>
        </>
    );
};

export default Navbar;
