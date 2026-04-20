import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { MapPin } from 'lucide-react';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const role = await login(formData.email, formData.password);
            navigate(role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            alert('Login failed. Please check your credentials.');
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
                        City Explorer<br />& Reporter
                    </h2>
                    <p className="text-slate-600 text-[1.1rem] max-w-[400px] leading-relaxed">
                        Report city issues, track complaints, and improve your community together.
                    </p>
                </div>
            </div>

            {/* RIGHT: Form Panel */}
            <div className="w-[480px] shrink-0 bg-slate-50 flex items-center justify-center py-12 px-8 relative">
                {/* Card */}
                <div className="w-full max-w-[380px] bg-white border border-slate-200 rounded-[28px] p-10 shadow-sm">
                    <h2 className="text-[1.6rem] font-bold text-center mb-1.5 text-slate-900">
                        Welcome Back
                    </h2>
                    <p className="text-center text-slate-500 text-[0.9rem] mb-8">
                        Sign in to your CivicFix account
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5">Email Address</label>
                            <input
                                className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 text-[0.9rem] font-inherit outline-none box-border focus:border-accent-from focus:ring-2 focus:ring-accent-from/20 transition-all"
                                type="email" placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})} required
                            />
                        </div>
                        <div>
                            <label className="block text-[0.8rem] font-bold text-slate-700 mb-1.5">Password</label>
                            <input
                                className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 text-[0.9rem] font-inherit outline-none box-border focus:border-accent-from focus:ring-2 focus:ring-accent-from/20 transition-all"
                                type="password" placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})} required
                            />
                        </div>

                        <button type="submit" disabled={loading} className={`mt-2 w-full btn-primary py-3 ${loading ? 'opacity-70' : 'opacity-100'}`}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <p className="text-center text-slate-500 text-[0.875rem] mt-2 font-medium">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-accent-from no-underline font-bold">Sign up</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
