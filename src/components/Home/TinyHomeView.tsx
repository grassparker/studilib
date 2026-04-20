import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { User, HomeItem } from '../../types';
import { supabase } from '../Auth/supabaseClient';

interface InteractiveItem extends HomeItem {
  level: number;
  lastInteracted?: string;
}

export const TinyHomeView: React.FC<{ user: User; updateCoins: (amount: number) => void }> = ({ user, updateCoins }) => {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<InteractiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const GRID_SIZE = 10;

  const shopItems = useMemo(() => [
    { id: 'shelf', name: 'Oak Bookshelf', price: 20, icon: 'fa-book-open', color: '#5F7A61', action: 'Organize' },
    { id: 'lamp', name: 'Ambient Lamp', price: 15, icon: 'fa-lightbulb', color: '#B49B85', action: 'Light' },
    { id: 'plant', name: 'Monstera', price: 10, icon: 'fa-leaf', color: '#81c784', action: 'Water' },
    { id: 'desk', name: 'Minimalist Desk', price: 50, icon: 'fa-desktop', color: '#475569', action: 'Clean' },
  ], [t]);

  const saveHomeToDB = async (updatedItems: InteractiveItem[]) => {
    await supabase.from('profiles').update({ home_layout: updatedItems }).eq('id', user.id);
  };

  useEffect(() => {
    const loadHome = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('home_layout').eq('id', user.id).single();
      if (data?.home_layout) setItems(data.home_layout);
      setLoading(false);
    };
    loadHome();
  }, [user.id]);

  const buyItem = (shopItem: any) => {
    if (items.some(i => i.itemTypeId === shopItem.id)) return;
    if (user.coins < shopItem.price) return;

    const emptySlots: {x: number, y: number}[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!items.some(i => i.position.x === x && i.position.y === y)) emptySlots.push({ x, y });
      }
    }

    if (emptySlots.length > 0) {
      const newPos = emptySlots[Math.floor(Math.random() * emptySlots.length)];
      updateCoins(-shopItem.price);
      
      const newItem: InteractiveItem = {
        id: crypto.randomUUID(),
        itemTypeId: shopItem.id,
        name: shopItem.name,
        icon: shopItem.icon,
        price: shopItem.price,
        type: 'furniture',
        position: newPos,
        level: 1 
      };

      const updated = [...items, newItem];
      setItems(updated);
      saveHomeToDB(updated);
    }
  };

  const interactWithItem = (id: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        return { ...item, level: item.level + 1, lastInteracted: new Date().toISOString() };
      }
      return item;
    });
    setItems(updated);
    saveHomeToDB(updated);
  };

  return (
    <div className="study-font flex flex-col min-h-full gap-6 p-6 pb-24 overflow-y-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lexend:wght@600&display=swap');
        .study-font { font-family: 'Inter', sans-serif; }
        .heading-font { font-family: 'Lexend', sans-serif; }

        .studio-floor {
          background-color: #f8fafc;
          background-image: 
            linear-gradient(rgba(95, 122, 97, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(95, 122, 97, 0.05) 1px, transparent 1px);
          background-size: 10% 10%;
          border-radius: 24px;
          border: 2px solid #e2e8f0;
          aspect-ratio: 1 / 1;
          position: relative;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
        }

        .furniture-item {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }

        .furniture-item:hover {
          transform: scale(1.1) translateY(-5px);
          z-index: 50;
        }

        .lvl-badge {
          font-size: 9px;
          font-weight: 800;
          background: #1e293b; /* Darker for contrast */
          color: white;
          padding: 2px 6px;
          border-radius: 6px;
          position: absolute;
          top: 0;
          right: 0;
          transform: translate(30%, -30%); /* Offset from icon box */
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          pointer-events: none;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end px-2">
            <div>
              <h2 className="heading-font text-xl text-slate-800">Your Study Haven</h2>
              <p className="text-sm text-slate-500">Decorate your focus space as you grow.</p>
            </div>
            <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-widest">Balance</span>
              <span className="font-bold text-[#5F7A61]">{user.coins} 🪙</span>
            </div>
          </div>

          <div className="studio-floor">
            {items.map((item) => {
              const shopData = shopItems.find(s => s.id === item.itemTypeId);
              return (
                <div
                  key={item.id}
                  onClick={() => interactWithItem(item.id)}
                  className="absolute w-[10%] h-[10%] flex items-center justify-center cursor-pointer furniture-item"
                  style={{ left: `${item.position.x * 10}%`, top: `${item.position.y * 10}%` }}
                >
                  <div className="w-[80%] h-[80%] rounded-xl flex items-center justify-center text-white relative"
                       style={{ backgroundColor: shopData?.color || '#5F7A61' }}>
                    <i className={`fas ${item.icon} text-lg`}></i>
                    <div className="lvl-badge">Lv{item.level}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Focus Quests</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#F7F9F9] border border-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold">Morning Scribe</span>
                  <span className="text-[10px] text-[#5F7A61]">+10 🪙</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5F7A61]" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Catalog</h3>
            <div className="grid grid-cols-1 gap-3">
              {shopItems.map((item) => {
                const isOwned = items.some(i => i.itemTypeId === item.id);
                return (
                  <button
                    key={item.id}
                    disabled={isOwned}
                    onClick={() => buyItem(item)}
                    className={`group w-full p-3 flex items-center gap-4 rounded-2xl border transition-all ${isOwned ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-slate-100 hover:border-[#5F7A61] hover:shadow-md'}`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                         style={{ backgroundColor: item.color }}>
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">{isOwned ? "Already Placed" : `${item.price} Coins`}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};