import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from './supabaseClient';

interface AuthFormsProps {
  onLogin: () => void;
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBBF24] p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .auth-scope * {
          font-family: 'Press Start 2P', cursive !important;
          text-transform: uppercase;
        }

        .pixel-card {
          background: white;
          border: 6px solid black;
          box-shadow: 12px 12px 0 0 rgba(0,0,0,1);
        }

        .pixel-input {
          background: white;
          border: 4px solid black;
          padding: 12px;
          font-size: 8px;
          outline: none;
          width: 100%;
        }

        .pixel-btn {
          background: #FBBF24;
          border: 4px solid black;
          padding: 16px;
          font-size: 10px;
          box-shadow: 4px 4px 0 0 black;
          transition: all 0.1s;
        }

        .pixel-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 0 black;
        }

        .tab-btn {
          padding: 12px;
          font-size: 8px;
          border-bottom: 4px solid transparent;
        }

        .tab-btn.active {
          border-bottom: 4px solid #FBBF24;
          color: black;
        }
      `}</style>

      <div className="auth-scope max-w-md w-full pixel-card overflow-hidden">
        {/* Top Banner */}
        <div className="bg-black p-8 text-white text-center border-b-4 border-black">
          <div className="w-16 h-16 bg-white border-4 border-[#FBBF24] flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-terminal text-black text-2xl"></i>
          </div>
          <h1 className="text-xl tracking-tighter mb-2">STUDILIB</h1>
          <p className="text-[8px] text-amber-400">{t('welcome_studilib')}</p>
        </div>

        <div className="p-8">
          {/* Toggle Tabs */}
          <div className="flex mb-8 border-b-4 border-black">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 tab-btn ${isLogin ? 'active' : 'opacity-40'}`}
            >
              [ {t('login')} ]
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 tab-btn ${!isLogin ? 'active' : 'opacity-40'}`}
            >
              [ {t('signup')} ]
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-[8px] mb-2">{t('user_id')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pixel-input"
                  placeholder={t('id_identifier')}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-[8px] mb-2">{t('email_address')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pixel-input"
                placeholder={t('user_domain')}
                required
              />
            </div>
            <div>
              <label className="block text-[8px] mb-2">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pixel-input"
                placeholder={t('password_placeholder')}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full pixel-btn disabled:opacity-50"
            >
              {loading ? t('processing') : (isLogin ? t('initiate_session') : t('register_user'))}
            </button>
          </form>

          <p className="text-[6px] text-center mt-8 text-gray-400 tracking-widest">
            {t('secure_encryption')}
          </p>
        </div>
      </div>
    </div>
  );
};