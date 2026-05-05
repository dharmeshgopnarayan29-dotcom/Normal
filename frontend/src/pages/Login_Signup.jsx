import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [signupData, setSignupData] = useState({
    username: "", email: "", password: "", role: "citizen",
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const role = await login(loginData.username, loginData.password);
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      alert('Login Failed. Please check your credentials...');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    try {
      await api.post('users/register/', signupData);
      alert("Registration Successful. Please Login...");
      setIsFlipped(false);
      setSignupData({ username: "", email: "", password: "", role: "citizen" });
    } catch (err) {
      alert('Registration Failed');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="dashboard-bg flex justify-center items-center min-h-screen relative overflow-hidden px-4">

      <div className="glass flex overflow-hidden relative z-10 w-full max-w-[900px] md:h-[520px] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 bg-slate-100/90 border-slate-200/50 flex-col md:flex-row page-transition">

        {/* LEFT SIDE: Branding */}
        <div className="hidden md:flex w-1/2 p-[50px] flex-col justify-center text-slate-900">
          <h1 className="text-[42px] mb-2.5 font-extrabold tracking-tight text-slate-900">CivicConnect</h1>
          <h3 className="mb-5 text-xl font-bold text-slate-700">City Explorer & Reporter</h3>
          <p className="leading-[1.6] text-slate-500 font-medium">
            Report city issues, track complaints, and help improve your community.
          </p>
        </div>

        {/* RIGHT SIDE: Animated Form Card */}
        <div className="w-full md:w-1/2 flex justify-center items-center perspective-[1000px] py-8 md:py-0 px-4 md:px-0">
          <div className={`w-full max-w-[320px] h-[420px] relative transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>

            {/* Login Side */}
            <div className="absolute w-full h-full flex flex-col justify-center items-center text-center bg-gray-50 border border-gray-200 rounded-[28px] p-[30px] shadow-xl backface-hidden">
              <div className="w-full">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Login to CivicConnect</h2>
                <form onSubmit={handleLogin} className="flex flex-col w-full mt-2.5">
                  <p className="text-[12px] pl-[10px] text-left text-slate-600 font-bold mb-1">Username</p>
                  <input
                    type="text"
                    placeholder="Username"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({ ...loginData, username: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1.5 p-2.5 rounded-xl border border-gray-300 bg-white text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                    required
                  />
                  <p className="text-[12px] pl-[10px] text-left text-slate-600 font-bold mb-1 mt-2">Password</p>
                  <div className="relative w-[92%] mx-auto">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      className="w-full my-1.5 p-2.5 rounded-xl border border-gray-300 bg-white text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button type="submit" disabled={loginLoading} className={`mt-5 mx-auto w-[60%] p-3 bg-black text-white font-bold rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:scale-95 flex items-center justify-center gap-2 ${loginLoading ? 'btn-loading' : ''}`}>
                    {loginLoading ? <><LoadingSpinner size={18} color="white" /> Logging in...</> : 'Login'}
                  </button>
                </form>
              </div>

              <p className="mt-5 text-[14px] text-slate-500 font-medium">
                Don’t have an account?{" "}
                <span className="text-black cursor-pointer font-bold hover:underline" onClick={() => setIsFlipped(true)}>
                  Signup
                </span>
              </p>
            </div>

            {/* Signup Side */}
            <div className="absolute w-full h-full flex flex-col justify-center items-center text-center bg-gray-50 border border-gray-200 rounded-[28px] p-[30px] shadow-xl backface-hidden [transform:rotateY(180deg)]">
              <div className="w-full">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Signup</h2>
                <form onSubmit={handleSignup} className="flex flex-col w-full mt-2.5">
                  <input
                    type="text"
                    placeholder="Username"
                    value={signupData.username}
                    onChange={(e) =>
                      setSignupData({ ...signupData, username: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1.5 p-2 rounded-xl border border-gray-300 bg-white text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1.5 p-2 rounded-xl border border-gray-300 bg-white text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm"
                    required
                  />
                  <div className="relative w-[92%] mx-auto">
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Password"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({ ...signupData, password: e.target.value })
                      }
                      className="w-full my-1.5 p-2 rounded-xl border border-gray-300 bg-white text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    >
                      {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <select
                    value={signupData.role}
                    onChange={(e) =>
                      setSignupData({ ...signupData, role: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1.5 p-2 rounded-xl border border-gray-300 bg-white text-black focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm"
                  >
                    <option value="citizen" >Citizen</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button type="submit" disabled={signupLoading} className={`mt-4 mx-auto w-[60%] p-3 bg-black text-white font-bold rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:scale-95 flex items-center justify-center gap-2 ${signupLoading ? 'btn-loading' : ''}`}>
                    {signupLoading ? <><LoadingSpinner size={18} color="white" /> Signing up...</> : 'Signup'}
                  </button>
                </form>
              </div>

              <p className="mt-4 text-[14px] text-slate-500 font-medium">
                Already have an account?{" "}
                <span className="text-black cursor-pointer font-bold hover:underline" onClick={() => setIsFlipped(false)}>
                  Login
                </span>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
