import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from './supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

interface AuthFormsProps {
  onLogin: () => void;
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onLogin }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [isPending, setisPending] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Updated effect to match the new global palette
  useEffect(() => {
    document.body.style.background = 'linear-gradient(180deg, #000d3d 0%, #1a478a 40%, #7a98b9 80%, #e6ccb2 100%)';
    document.body.style.backgroundAttachment = 'fixed';
    return () => { document.body.style.background = ''; };
  }, []);

  const userLogsIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setisPending(true);

    try {
      if (isLoginTab) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`,
            },
          },
        });
        if (error) throw error;
        alert(t('access_granted'));
      }
      onLogin(); 
    } catch (error: any) {
      alert(error.message || t('system_error'));
    } finally {
      setisPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 tech-font relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;600&display=swap');
        
        .tech-font { font-family: 'Inter', sans-serif; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }

        /* Updated to Glassmorphism Horizon Style */
        .auth-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 10;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border-radius: 24px;
        }

        .input-field {
          width: 100%;
          padding: 14px 16px;
          background: rgba(0, 13, 61, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 13px;
          color: #f8fafc;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .input-field:focus {
          outline: none;
          border-color: #7a98b9;
          background: rgba(0, 13, 61, 0.6);
          box-shadow: 0 0 20px rgba(122, 152, 185, 0.2);
        }

        .btn-submit {
          background: #e6ccb2; /* Palette Highlight Color */
          color: #000d3d;
          padding: 18px;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 10px;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .btn-submit:hover:not(:disabled) {
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(230, 204, 178, 0.3);
        }

        .tab-trigger {
          position: relative;
          padding: 16px;
          font-weight: 600;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.4);
          transition: all 0.3s;
          letter-spacing: 0.1em;
        }

        .tab-trigger.active {
          color: #ffffff;
        }

        .tab-indicator {
          position: absolute;
          bottom: 10px;
          left: 20%;
          right: 20%;
          height: 2px;
          background: #e6ccb2;
          border-radius: 2px;
          box-shadow: 0 0 10px #e6ccb2;
        }

        .star-bg {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          opacity: 0.3;
        }
      `}</style>

      {/* AMBIENT BACKGROUND STARS */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="star-bg animate-pulse" 
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="auth-card overflow-hidden">
        {/* Branding Header - Simplified & Airy */}
        <div className="p-8 text-center relative border-b border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 backdrop-blur-sm shadow-xl">
             <i className="fas fa-feather-alt text-blue-200 text-2xl"></i>
          </div>
          <h1 className="text-[14px] pixel-font text-white tracking-[0.2em] uppercase">StudiLib</h1>
          <p className="text-[7px] pixel-font text-blue-200/50 mt-3 uppercase tracking-widest">Horizon Protocol</p>
        </div>

        <div className="p-8">
          {/* Tabs - Pill style */}
          <div className="flex bg-black/20 rounded-xl p-1 mb-8 border border-white/5">
            <button
              onClick={() => setIsLoginTab(true)}
              className={`flex-1 tab-trigger pixel-font rounded-lg ${isLoginTab ? 'active' : ''}`}
            >
              {t('login')}
              {isLoginTab && <div className="tab-indicator" />}
            </button>
            <button
              onClick={() => setIsLoginTab(false)}
              className={`flex-1 tab-trigger pixel-font rounded-lg ${!isLoginTab ? 'active' : ''}`}
            >
              {t('signup')}
              {!isLoginTab && <div className="tab-indicator" />}
            </button>
          </div>

          <form onSubmit={userLogsIn} className="space-y-5">
            {!isLoginTab && (
              <div className="space-y-2">
                <label className="text-[7px] pixel-font text-blue-200/40 uppercase tracking-widest block ml-1">{t('Identity')}</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                  placeholder={t('username_placeholder')}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[7px] pixel-font text-blue-200/40 uppercase tracking-widest block ml-1">{t('Uplink')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="email@university.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[7px] pixel-font text-blue-200/40 uppercase tracking-widest block ml-1">{t('password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isPending}
              className="w-full btn-submit pixel-font disabled:opacity-50 mt-6"
            >
              {isPending ? (
                <i className="fas fa-circle-notch animate-spin text-lg"></i>
              ) : (
                <>
                  {isLoginTab ? t('authorize_session') : t('generate_credentials')}
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 w-full opacity-10">
               <span className="h-[1px] flex-1 bg-white"></span>
               <i className="fas fa-star text-[8px] text-white"></i>
               <span className="h-[1px] flex-1 bg-white"></span>
            </div>
            <p className="text-[6px] pixel-font text-white/30 uppercase tracking-[0.3em]">
              Secure Horizon Connection
            </p>

            <button 
              onClick={() => navigate('/')} // CORRECT NAVIGATION CODE
              className="pixel-font text-[8px] border border-[#e6ccb2]/40 text-[#e6ccb2] px-6 py-3 rounded-xl hover:bg-[#e6ccb2] hover:text-[#000d3d] transition-all"
            >
              {t('back_to_home')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};