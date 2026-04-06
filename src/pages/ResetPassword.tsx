import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../components/Auth/supabaseClient';
import { useNavigate } from 'react-router-dom';

export const ResetPassword = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setMessage(t('password_too_short'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage(`ERROR: ${error.message}`);
    } else {
      setMessage(t('system_reconfigured'));
      setTimeout(() => navigate('/login'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FBBF24] flex items-center justify-center p-6 font-pixel">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
        .font-pixel { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace; }
        .pixel-box {
          background: white;
          border: 6px solid black;
          box-shadow: 10px 10px 0 0 black;
        }
      `}</style>

      <div className="pixel-box p-8 max-w-md w-full">
        <h2 className="text-[12px] mb-6 border-b-4 border-black pb-2 uppercase font-bold">
          {">"} RE_ENCRYPTION_MODE
        </h2>
        
        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-[8px] mb-2 uppercase">{t('new_pass')}:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-4 border-black p-3 text-[10px] focus:outline-none focus:bg-gray-50"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-[#FBBF24] p-4 text-[10px] font-bold uppercase hover:bg-gray-900 active:translate-y-1"
          >
            {loading ? t('processing') : `[ ${t('execute_update')} ]`}
          </button>
        </form>

        {message && (
          <div className="mt-6 p-2 bg-gray-100 border-2 border-black text-[8px] text-center uppercase">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};