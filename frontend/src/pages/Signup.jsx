import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { MapPin } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'citizen' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('users/register/', formData);
            navigate('/login');
        } catch (err) {
            alert('Registration failed. Please check your inputs or try a different email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen font-inherit">
            {/* LEFT: Branding Panel */}
            <div className="flex-1 relative bg-slate-100 flex flex-col justify-center p-12 overflow-hidden min-h-screen border-r border-slate-200">
                {/* Branding */}
                <div className="relative z-[2]">
                    <div className="flex items-center gap-2.5 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-accent-from/10 flex items-center justify-center">
                            <MapPin size={26} className="text-accent-from" />
                        </div>
                        <span className="text-[2rem] font-extrabold text-slate-900 tracking-[-0.5px]">CivicFix</span>
                    </div>
                    <h2 className="text-[2.5rem] font-bold text-slate-900 mb-4 leading-[1.2]">
                        Join Your<br />Community
                    </h2>
                    <p className="text-slate-600 text-[1.1rem] max-w-[400px] leading-relaxed">
                        Create an account and start reporting civic issues to make your city better.
                    </p>
                    {/* Feature pills */}
                    <div className="flex flex-col gap-3 mt-8">
                        {['📍 Report issues instantly', '🗺️ Track on interactive map', '🔔 Get real-time updates'].map(f => (
                            <div key={f} className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-full py-2.5 px-5 text-[0.9rem] text-slate-700 w-fit font-medium">
                                {f}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: Form Panel */}
            <div className="w-[500px] shrink-0 bg-slate-50 flex items-center justify-center py-12 px-8 relative">
                <div className="w-full max-w-[400px] bg-white border border-slate-200 rounded-[28px] p-10 shadow-sm">
                    <h2 className="text-[1.6rem] font-bold text-center mb-1.5 text-slate-900">
                        Create Account
                    </h2>
                    <p className="text-center text-slate-500 text-[0.9rem] mb-8">
                        Join CivicFix today
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-[0.85rem]">
                        <div>
                            <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5">Display Name</label>
                            <input className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 text-[0.9rem] font-inherit outline-none box-border focus:border-accent-from focus:ring-2 focus:ring-accent-from/20 transition-all" type="text" placeholder="John Doe" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5">Email Address</label>
                            <input className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 text-[0.9rem] font-inherit outline-none box-border focus:border-accent-from focus:ring-2 focus:ring-accent-from/20 transition-all" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5">Password</label>
                            <input className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 text-[0.9rem] font-inherit outline-none box-border focus:border-accent-from focus:ring-2 focus:ring-accent-from/20 transition-all" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5">I am a</label>
                            <select className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 text-[0.9rem] font-inherit outline-none box-border cursor-pointer focus:border-accent-from focus:ring-2 focus:ring-accent-from/20 transition-all" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                <option value="citizen">Citizen</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <button type="submit" disabled={loading} className={`mt-2 w-full btn-primary py-3 ${loading ? 'opacity-70' : 'opacity-100'}`}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>

                        <p className="text-center text-slate-500 text-[0.875rem] mt-1 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-accent-from no-underline font-bold">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
