import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from './supabaseClient';

interface AuthFormsProps {
  onLogin: () => void;
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onLogin }) => {
  const [isLoggedIn, setisLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [isPending, setisPending] = useState(false);
  const { t } = useTranslation();

  const userLogsIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setisPending(true);

    try {
      if (isLoggedIn) {
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
              avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${formData.username}`,
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
    <div className="min-h-screen flex items-center justify-center pattern-grass p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
        
        .auth-scope *:not(i) { font-family: 'Press Start 2P', 'LXGW WenKai TC' , monospace !important; text-transform: uppercase; }
        .auth-scope i { font-family: "Font Awesome 6 Free" !important; font-weight: 900; text-transform: none !important; }

        .pattern-grass {
          background-color: #4caf50;
          background-image: linear-gradient(0deg, #388e3c 1px, transparent 1px),
                            linear-gradient(90deg, #388e3c 1px, transparent 1px);
          background-size: 8px 8px;
        }

        .pixel-card {
          background: #fffdf5;
          border: 6px solid #3e2723;
          box-shadow: 12px 12px 0 0 #2a1b0a;
          background-image: repeating-linear-gradient(90deg, #fdf4db, #fdf4db 2px, transparent 2px, transparent 4px),
                            repeating-linear-gradient(0deg, #fdf4db, #fdf4db 2px, transparent 2px, transparent 4px);
          background-size: 8px 8px;
        }

        .pixel-input {
          background: #fdfbf7;
          border: 4px solid #5d4037;
          padding: 12px;
          font-size: 8px;
          outline: none;
          width: 100%;
          color: #3e2723;
        }

        .pixel-btn {
          background: #8d6e63;
          color: white;
          border: 4px solid #3e2723;
          padding: 16px;
          font-size: 10px;
          box-shadow: 4px 4px 0 0 #2a1b0a;
          transition: all 0.1s;
        }

        .pixel-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 0px 0px 0 0 #2a1b0a;
        }

        .tab-btn {
          padding: 12px;
          font-size: 8px;
          border-bottom: 6px solid #d7ccc8;
          color: #8d6e63;
        }

        .tab-btn.active {
          border-bottom: 6px solid #4caf50;
          color: #1b5e20;
        }

        .stone-header {
          background: #78909c;
          border-bottom: 6px solid #37474f;
          position: relative;
        }

        .stone-header::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 10px;
          background: #37474f;
          clip-path: polygon(0 0, 50% 100%, 100% 0);
        }
      `}</style>

      <div className="auth-scope max-w-md w-full pixel-card overflow-hidden">
        {/* Title Screen Header */}
        <div className="stone-header p-8 text-white text-center">
          <div className="w-16 h-16 bg-[#fffdf5] border-4 border-[#37474f] flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0_0_#1b262a]">
            <i className="fas fa-scroll text-[#3e2723] text-2xl"></i>
          </div>
          <h1 className="text-xl tracking-tighter mb-2 text-[#eceff1]" style={{ textShadow: '4px 4px 0px #37474f' }}>STUDILIB</h1>
          <p className="text-[8px] text-[#b0bec5]">{t('welcome_studilib')}</p>
        </div>

        <div className="p-8">
          <div className="flex mb-8">
            <button
              onClick={() => setisLoggedIn(true)}
              className={`flex-1 tab-btn ${isLoggedIn ? 'active' : 'opacity-60'}`}
            >
              {t('login')}
            </button>
            <button
              onClick={() => setisLoggedIn(false)}
              className={`flex-1 tab-btn ${!isLoggedIn ? 'active' : 'opacity-60'}`}
            >
              {t('signup')}
            </button>
          </div>

          <form onSubmit={userLogsIn} className="space-y-6">
            {!isLoggedIn && (
              <div>
                <label className="block text-[8px] mb-2 text-[#5d4037]">{t('user_id')}</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pixel-input"
                  placeholder={t('id_identifier')}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-[8px] mb-2 text-[#5d4037]">{t('email_address')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pixel-input"
                placeholder={t('user_domain')}
                required
              />
            </div>
            <div>
              <label className="block text-[8px] mb-2 text-[#5d4037]">{t('password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pixel-input"
                placeholder={t('password_placeholder')}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isPending}
              className="w-full pixel-btn disabled:opacity-50"
            >
              {isPending ? t('processing') : (isLoggedIn ? "👉 " + t('initiate_session') : "🌲 " + t('register_user'))}
            </button>
          </form>

          <p className="text-[6px] text-center mt-8 text-[#a1887f] tracking-widest italic">
            -- {t('secure_encryption')} --
          </p>
        </div>
      </div>
    </div>
  );
};