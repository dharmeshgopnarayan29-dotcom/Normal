import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
      console.log(err.response?.status);
      console.log(err.response?.data);
      alert('Registration Failed');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="auth-bg flex justify-center items-center min-h-screen px-4">

      {/* Frosted-glass main card */}
      <div
        className="flex overflow-hidden w-full max-w-[900px] md:h-[520px] flex-col md:flex-row
                   rounded-[32px] border border-white/40
                   bg-white/20 backdrop-blur-xl
                   shadow-[0_24px_64px_rgba(139,92,246,0.25),0_8px_24px_rgba(0,0,0,0.12)]
                   transition-all duration-500 hover:shadow-[0_32px_80px_rgba(139,92,246,0.35)] hover:-translate-y-2"
      >

        {/* LEFT SIDE: Branding */}
        <div className="hidden md:flex w-1/2 p-[50px] flex-col justify-center">
          <h1 className="text-[42px] mb-2.5 font-extrabold tracking-tight text-white drop-shadow-sm">
            CivicConnect
          </h1>
          <h3 className="mb-5 text-xl font-bold text-white/80">City Explorer &amp; Reporter</h3>
          <p className="leading-[1.7] text-white/65 font-medium text-[0.95rem]">
            Report city issues, track complaints, and help improve your community — all in one place.
          </p>

          {/* Decorative dots */}
          <div className="mt-10 flex gap-2">
            <span className="w-2 h-2 rounded-full bg-white/40"></span>
            <span className="w-2 h-2 rounded-full bg-white/25"></span>
            <span className="w-2 h-2 rounded-full bg-white/15"></span>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block w-[1px] bg-white/20 my-10 shrink-0" />

        {/* RIGHT SIDE: Animated Form Card */}
        <div className="w-full md:w-1/2 flex justify-center items-center perspective-[1000px] py-8 md:py-0 px-6 md:px-8">
          <div className={`w-full max-w-[320px] h-[420px] relative transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>

            {/* Login Side */}
            <div className="absolute w-full h-full flex flex-col justify-center items-center text-center
                            bg-white/90 backdrop-blur-md border border-white/60
                            rounded-[28px] p-[30px] shadow-[0_8px_32px_rgba(139,92,246,0.15)] backface-hidden">
              <div className="w-full">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome back</h2>
                <p className="text-[0.8rem] text-slate-500 mb-4 font-medium">Sign in to your account</p>
                <form onSubmit={handleLogin} className="flex flex-col w-full">
                  <p className="text-[12px] pl-[10px] text-left text-slate-600 font-bold mb-1">Username</p>
                  <input
                    type="text"
                    placeholder="Username"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({ ...loginData, username: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1.5 p-2.5 rounded-xl border border-violet-200 bg-white text-black
                               placeholder:text-gray-400 focus:outline-none focus:border-violet-400
                               focus:ring-2 focus:ring-violet-300/30 transition-all"
                    required
                  />
                  <p className="text-[12px] pl-[10px] text-left text-slate-600 font-bold mb-1 mt-2">Password</p>
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1.5 p-2.5 rounded-xl border border-violet-200 bg-white text-black
                               placeholder:text-gray-400 focus:outline-none focus:border-violet-400
                               focus:ring-2 focus:ring-violet-300/30 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className={`mt-5 mx-auto w-[70%] p-3
                      bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-2xl
                      cursor-pointer transition-all duration-300 shadow-md
                      hover:-translate-y-1.5 hover:scale-[1.03]
                      hover:shadow-[0_10px_24px_rgba(139,92,246,0.45)]
                      active:scale-95 flex items-center justify-center gap-2
                      ${loginLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loginLoading ? <><LoadingSpinner size={18} color="white" /> Logging in...</> : 'Login'}
                  </button>
                </form>
              </div>

              <p className="mt-5 text-[14px] text-slate-500 font-medium">
                Don't have an account?{" "}
                <span
                  className="text-violet-600 cursor-pointer font-bold hover:underline"
                  onClick={() => setIsFlipped(true)}
                >
                  Signup
                </span>
              </p>
            </div>

            {/* Signup Side */}
            <div className="absolute w-full h-full flex flex-col justify-center items-center text-center
                            bg-white/90 backdrop-blur-md border border-white/60
                            rounded-[28px] p-[30px] shadow-[0_8px_32px_rgba(139,92,246,0.15)]
                            backface-hidden [transform:rotateY(180deg)]">
              <div className="w-full">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Create Account</h2>
                <p className="text-[0.78rem] text-slate-500 mb-3 font-medium">Join the community today</p>
                <form onSubmit={handleSignup} className="flex flex-col w-full">
                  <input
                    type="text"
                    placeholder="Username"
                    value={signupData.username}
                    onChange={(e) =>
                      setSignupData({ ...signupData, username: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1 p-2 rounded-xl border border-violet-200 bg-white text-black
                               placeholder:text-gray-400 focus:outline-none focus:border-violet-400
                               focus:ring-2 focus:ring-violet-300/30 transition-all text-sm"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1 p-2 rounded-xl border border-violet-200 bg-white text-black
                               placeholder:text-gray-400 focus:outline-none focus:border-violet-400
                               focus:ring-2 focus:ring-violet-300/30 transition-all text-sm"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1 p-2 rounded-xl border border-violet-200 bg-white text-black
                               placeholder:text-gray-400 focus:outline-none focus:border-violet-400
                               focus:ring-2 focus:ring-violet-300/30 transition-all text-sm"
                    required
                  />
                  <select
                    value={signupData.role}
                    onChange={(e) =>
                      setSignupData({ ...signupData, role: e.target.value })
                    }
                    className="w-[92%] mx-auto my-1 p-2 rounded-xl border border-violet-200 bg-white text-black
                               focus:outline-none focus:border-violet-400 focus:ring-2
                               focus:ring-violet-300/30 transition-all text-sm"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    type="submit"
                    disabled={signupLoading}
                    className={`mt-3 mx-auto w-[70%] p-3
                      bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-2xl
                      cursor-pointer transition-all duration-300 shadow-md
                      hover:-translate-y-1.5 hover:scale-[1.03]
                      hover:shadow-[0_10px_24px_rgba(139,92,246,0.45)]
                      active:scale-95 flex items-center justify-center gap-2
                      ${signupLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {signupLoading ? <><LoadingSpinner size={18} color="white" /> Signing up...</> : 'Signup'}
                  </button>
                </form>
              </div>

              <p className="mt-3 text-[14px] text-slate-500 font-medium">
                Already have an account?{" "}
                <span
                  className="text-violet-600 cursor-pointer font-bold hover:underline"
                  onClick={() => setIsFlipped(false)}
                >
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
