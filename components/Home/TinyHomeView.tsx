
import React, { useState, useEffect } from 'react';
import { User, HomeItem } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { loginUser, signUpUser } from '../Auth/auth';

interface TinyHomeViewProps {
  user: User;
  updateCoins: (amount: number) => void;
}

export const TinyHomeView: React.FC<TinyHomeViewProps> = ({ user, updateCoins }) => {
  const [items, setItems] = useState<HomeItem[]>([
    { id: '1', name: 'Simple Desk', price: 0, icon: 'fa-desk', type: 'furniture', position: { x: 5, y: 5 } },
  ]);
  const [inspiration, setInspiration] = useState('');
  const [isLoadingInspo, setIsLoadingInspo] = useState(false);

  const shopItems = [
    { id: 'shelf', name: 'Oak Bookshelf', price: 20, icon: 'fa-list-ul' },
    { id: 'lamp', name: 'Study Lamp', price: 15, icon: 'fa-lightbulb' },
    { id: 'plant', name: 'Potted Lily', price: 10, icon: 'fa-leaf' },
    { id: 'chair', name: 'Ergo Chair', price: 30, icon: 'fa-chair' },
    { id: 'rug', name: 'Cozy Rug', price: 25, icon: 'fa-square' },
    { id: 'coffee', name: 'Coffee Station', price: 40, icon: 'fa-mug-hot' },
  ];

  const buyItem = (item: any) => {
    if (user.coins >= item.price) {
      updateCoins(-item.price);
      setItems([...items, { ...item, position: { x: Math.floor(Math.random() * 8) + 1, y: Math.floor(Math.random() * 8) + 1 } }]);
    } else {
      alert("Not enough coins! Go study some more! 📖");
    }
  };

  return (
    <div className="flex flex-col h-full gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* The House Canvas */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-quicksand text-slate-800">Your Tiny Study Haven</h2>
              <p className="text-slate-500 text-sm">Design your perfect focus space with your earned coins.</p>
            </div>
            <div className="bg-amber-100 text-amber-700 font-bold px-4 py-2 rounded-2xl flex items-center gap-2">
              <i className="fas fa-coins"></i>
              {user.coins}
            </div>
          </div>

          <div className="flex-1 bg-slate-50 rounded-[2rem] border-4 border-slate-100 tiny-home-grid relative overflow-hidden group">
            {/* Grid Visualization */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-20 pointer-events-none">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="border border-slate-300"></div>
              ))}
            </div>

            {/* Placed Items */}
            {items.map((item, i) => (
              <div
                key={i}
                className="absolute w-16 h-16 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center cursor-move transform hover:scale-110 transition-transform"
                style={{ 
                  left: `${item.position.x * 10}%`, 
                  top: `${item.position.y * 10}%`,
                  zIndex: item.position.y 
                }}
              >
                <i className={`fas ${item.icon} text-2xl text-amber-600`}></i>
              </div>
            ))}

            {items.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <i className="fas fa-box-open text-6xl mb-4"></i>
                <p className="font-bold">Room is empty. Buy something!</p>
              </div>
            )}
          </div>
        </div>

        {/* The Shop */}
        <div className="space-y-8 flex flex-col">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 font-quicksand">Haven Shop</h3>
            <div className="grid grid-cols-2 gap-4">
              {shopItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => buyItem(item)}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all flex flex-col items-center gap-2 group text-center"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 shadow-sm transition-colors mb-1">
                    <i className={`fas ${item.icon} text-xl`}></i>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-600">
                    <i className="fas fa-coins text-[8px]"></i>
                    {item.price}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
