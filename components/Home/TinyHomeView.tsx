import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { User, HomeItem } from '../../types';
import { supabase } from '../Auth/supabaseClient';


interface InteractiveItem extends HomeItem {
  level: number;
}

export const TinyHomeView: React.FC<{ user: User; updateCoins: (amount: number) => void }> = ({ user, updateCoins }) => {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<InteractiveItem[]>([]);
  const GRID_SIZE = 10;

  useEffect(() => {
    const loadHome = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('home_layout').eq('id', user.id).single();
      if (data?.home_layout) setItems(data.home_layout);
    };
    loadHome();
  }, [user.id]);

  const shopItems = useMemo(() => [
  { id: 'shelf', name: t('books'), price: 20, icon: 'fa-list-ul', color: 'bg-[#8b4513]', action: t('sort') },
  { id: 'lamp', name: t('lamp'), price: 15, icon: 'fa-lightbulb', color: 'bg-[#ffd700]', action: t('glow') },
  { id: 'plant', name: t('plant'), price: 10, icon: 'fa-leaf', color: 'bg-[#228b22]', action: t('grow') },
  { id: 'coffee', name: t('beans'), price: 40, icon: 'fa-mug-hot', color: 'bg-[#5c4033]', action: t('brew') },
], [i18n.language, t]);

  const saveHomeToDB = async (updatedItems: InteractiveItem[]) => {
    await supabase.from('profiles').update({ home_layout: updatedItems }).eq('id', user.id);
  };

  const buyItem = (shopItem: any) => {
    // 1. Check if already owned or not enough coins
    if (items.some(i => i.name === shopItem.name)) return;
    if (user.coins < shopItem.price) return;

    // 2. Generate a list of ALL available empty slots
    const emptySlots: {x: number, y: number}[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isOccupied = items.some(i => i.position.x === x && i.position.y === y);
        if (!isOccupied) {
          emptySlots.push({ x, y });
        }
      }
    }

    // 3. If there are empty slots, pick one at random
    if (emptySlots.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptySlots.length);
      const newPos = emptySlots[randomIndex];

      updateCoins(-shopItem.price);
      
      const newItem: InteractiveItem = {
        id: crypto.randomUUID(),
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
    } else {
      alert(t('room_full'));
    }
  };

  const upgradeItem = (id: string) => {
    const cost = 15;
    if (user.coins < cost) return;
    const updated = items.map(item => item.id === id ? { ...item, level: (item.level || 1) + 1 } : item);
    updateCoins(-cost);
    setItems(updated);
    saveHomeToDB(updated);
  };

  return (
    <div className="haven-scope flex flex-col min-h-full gap-4 p-4 pb-24 overflow-y-auto lg:overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .haven-scope { image-rendering: pixelated; }
        .haven-scope * { font-family: 'Press Start 2P', cursive !important; text-transform: uppercase; }

        .pixel-border-social {
          background: white;
          border: 4px solid black;
          box-shadow: 6px 6px 0 0 rgba(0,0,0,1);
        }

        .room-grid {
          background-color: #f0f0f0;
          background-image: 
            linear-gradient(to right, #ddd 1px, transparent 1px),
            linear-gradient(to bottom, #ddd 1px, transparent 1px);
          background-size: 10% 10%;
          aspect-ratio: 1 / 1; /* Keeps the room square on mobile */
          width: 100%;
          position: relative;
          border: 4px solid black;
        }

        .haven-scope i {
          font-family: "Font Awesome 6 Free" !important;
          text-transform: none !important;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* The Pixel Room (Social Theme) */}
        <div className="lg:col-span-2 pixel-border-social p-4 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-black">
            <h2 className="text-[10px] border-b-4 border-black pb-1">{t('study_zone')}</h2>
            <div className="bg-[#FBBF24] text-black px-3 py-1 border-4 border-black text-[10px] font-bold">
              $ {user.coins}
            </div>
          </div>

          <div className="room-grid">
            {items.map((item) => {
              const shopData = shopItems.find(s => s.icon === item.icon);
              return (
                <div
                  key={item.id}
                  onClick={() => upgradeItem(item.id)}
                  className={`absolute w-[10%] h-[10%] ${shopData?.color || 'bg-white'} border-2 md:border-4 border-black flex items-center justify-center cursor-pointer z-20`}
                  style={{ 
                    left: `${item.position.x * 10}%`, 
                    top: `${item.position.y * 10}%` 
                  }}
                >
                  <i className={`fas ${item.icon} text-white text-[10px] md:text-lg`}></i>
                  <div className="absolute -top-2 -right-2 bg-white text-black text-[6px] md:text-[8px] font-bold px-1 border-2 border-black z-30">
                    L{item.level}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pixel Shop (Social Theme) */}
        <section className="pixel-border-social p-6 h-fit lg:h-full lg:overflow-y-auto">
          <h3 className="text-center mb-6 text-[10px] text-black underline tracking-widest">{t('shop_list')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {shopItems.map((item) => {
              const owned = items.find(i => i.name === item.name);
              return (
                <button
                  key={item.id}
                  disabled={!!owned}
                  onClick={() => buyItem(item)}
                  className={`w-full p-3 flex items-center gap-4 border-4 border-black text-black transition-all ${owned ? 'bg-gray-200 opacity-50 cursor-not-allowed' : 'bg-white active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0_0_rgba(0,0,0,1)]'}`}
                >
                  <div className={`${item.color} w-10 h-10 border-2 border-black flex items-center justify-center text-white shrink-0`}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[8px] mb-1 leading-none">{item.name}</p>
                    <p className="text-[7px] font-bold">{owned ? t('owned') : `${item.price}C`}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};