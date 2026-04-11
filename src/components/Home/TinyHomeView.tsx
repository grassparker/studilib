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

  // 1. NATURE-RPG SHOP ITEMS
  const shopItems = useMemo(() => [
    { id: 'shelf', name: t('books'), price: 20, icon: 'fa-scroll', color: 'bg-[#8d6e63]', action: t('sort') },
    { id: 'lamp', name: t('lamp'), price: 15, icon: 'fa-fire', color: 'bg-[#ff9800]', action: t('glow') },
    { id: 'plant', name: t('plant'), price: 10, icon: 'fa-seedling', color: 'bg-[#4caf50]', action: t('grow') },
    { id: 'coffee', name: t('beans'), price: 40, icon: 'fa-flask', color: 'bg-[#78909c]', action: t('brew') },
  ], [i18n.language, t]);

  const saveHomeToDB = async (updatedItems: InteractiveItem[]) => {
    await supabase.from('profiles').update({ home_layout: updatedItems }).eq('id', user.id);
  };

  useEffect(() => {
    const loadHome = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('home_layout').eq('id', user.id).single();

      if (data?.home_layout) {
        let needsUpdate = false;
        const migratedItems = data.home_layout.map((item: any) => {
          if (!item.itemTypeId) {
            needsUpdate = true;
            const match = shopItems.find(s => s.icon === item.icon);
            return { ...item, itemTypeId: match ? match.id : 'unknown' };
          }
          return item;
        });
        setItems(migratedItems);
        if (needsUpdate) saveHomeToDB(migratedItems);
      }
    };
    loadHome();
  }, [user.id, shopItems]);

  const buyItem = (shopItem: any) => {
    if (items.some(i => i.itemTypeId === shopItem.id)) return;
    if (user.coins < shopItem.price) return;

    const emptySlots: {x: number, y: number}[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isOccupied = items.some(i => i.position.x === x && i.position.y === y);
        if (!isOccupied) emptySlots.push({ x, y });
      }
    }

    if (emptySlots.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptySlots.length);
      const newPos = emptySlots[randomIndex];
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
        @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
        
        .haven-scope { image-rendering: pixelated; }
        .haven-scope *:not(i) { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace !important; text-transform: uppercase; }
        
        /* The Parchment/Wood Border */
        .pixel-border-nature { 
          background: #fffdf5; 
          border: 6px solid #3e2723; 
          box-shadow: 8px 8px 0 0 #2a1b0a;
          background-image: repeating-linear-gradient(90deg, #fdf4db, #fdf4db 2px, transparent 2px, transparent 4px),
                            repeating-linear-gradient(0deg, #fdf4db, #fdf4db 2px, transparent 2px, transparent 4px);
          background-size: 8px 8px;
        }

        /* Grass Grid */
        .room-grid { 
          background-color: #4caf50; 
          background-image: linear-gradient(to right, #388e3c 2px, transparent 2px), 
                            linear-gradient(to bottom, #388e3c 2px, transparent 2px); 
          background-size: 10% 10%; 
          aspect-ratio: 1 / 1; 
          width: 100%; 
          position: relative; 
          border: 6px solid #3e2723; 
        }

        .haven-scope i { font-family: "Font Awesome 6 Free" !important; text-transform: none !important; font-weight: 900; }
        
        .item-node {
          transition: transform 0.1s;
          box-shadow: 4px 4px 0 0 #2a1b0a;
        }
        .item-node:hover { transform: scale(1.1); z-index: 50; }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* CAMP VIEW */}
        <div className="lg:col-span-2 pixel-border-nature p-4 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[#3e2723]">
            <h2 className="text-[10px] border-b-4 border-[#3e2723] pb-1">⛺ {t('study_zone')}</h2>
            <div className="bg-[#ffaa00] text-white px-3 py-1 border-4 border-[#3e2723] text-[10px] font-bold shadow-[4px_4px_0_0_#3e2723]">
              GOLD: {user.coins}
            </div>
          </div>

          <div className="room-grid shadow-inner">
            {items.map((item) => {
              const shopData = shopItems.find(s => s.id === item.itemTypeId);
              return (
                <div
                  key={item.id}
                  onClick={() => upgradeItem(item.id)}
                  className={`absolute w-[10%] h-[10%] ${shopData?.color || 'bg-white'} border-2 md:border-4 border-[#3e2723] flex items-center justify-center cursor-pointer z-20 item-node`}
                  style={{ left: `${item.position.x * 10}%`, top: `${item.position.y * 10}%` }}
                >
                  <i className={`fas ${item.icon} text-white text-[10px] md:text-lg`}></i>
                  <div className="absolute -top-3 -right-3 bg-[#fffdf5] text-[#3e2723] text-[6px] md:text-[8px] font-bold px-1 border-2 border-[#3e2723] z-30">
                    ★{item.level}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[6px] mt-4 text-[#8d6e63] text-center italic">TAP AN ITEM TO UPGRADE FOR 15 GOLD</p>
        </div>

        {/* TRADER VIEW */}
        <section className="pixel-border-nature p-6 h-fit lg:h-full lg:overflow-y-auto">
          <h3 className="text-center mb-6 text-[10px] text-[#3e2723] underline decoration-double tracking-widest">💰 {t('shop_list')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {shopItems.map((item) => {
              const isOwned = items.some(i => i.itemTypeId === item.id);
              return (
                <button
                  key={item.id}
                  disabled={isOwned}
                  onClick={() => buyItem(item)}
                  className={`w-full p-3 flex items-center gap-4 border-4 border-[#3e2723] text-[#3e2723] transition-all ${isOwned ? 'bg-[#d7ccc8] opacity-50 cursor-not-allowed' : 'bg-white active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0_0_#3e2723]'}`}
                >
                  <div className={`${item.color} w-10 h-10 border-2 border-[#3e2723] flex items-center justify-center text-white shrink-0`}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[8px] mb-1 leading-none font-bold">{item.name}</p>
                    <p className="text-[7px]">{isOwned ? "ALREADY OWNED" : `${item.price} GOLD`}</p>
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