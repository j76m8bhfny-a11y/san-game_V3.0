import React, { useState } from 'react';
import { placeholderBackgrounds, placeholderIcons } from '../utils/placeholderAssets';

interface Props {
  gold: number;
  onTithe: (amount: number) => void;
  onListen: () => void;
  onClose: () => void;
}

export const RustBeltChurchInterior: React.FC<Props> = ({ gold, onTithe, onListen, onClose }) => {
  const [showDonationBag, setShowDonationBag] = useState(false);
  const [isPreaching, setIsPreaching] = useState(false);

  const handleDonationClick = () => {
    setShowDonationBag(true);
  };

  const handleGiveMoney = (amount: number) => {
    if (gold < amount) return;
    onTithe(amount);
    setShowDonationBag(false);
  };

  const handleListenClick = () => {
    setIsPreaching(true);
    onListen();
    // 模拟狂热效果持续几秒
    setTimeout(() => setIsPreaching(false), 2000);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-black overflow-hidden">
      
      {/* 1. 背景：狂热的布道现场 (模糊) */}
      <div 
        className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-500 ${isPreaching ? 'scale-110 blur-md brightness-150 saturate-200' : 'blur-sm'}`}
        style={{ 
          background: placeholderBackgrounds.rust_church_interior,
        }}
      >
        {/* 动态灯光：模拟舞台灯 */}
        <div className="absolute top-0 left-1/4 w-20 h-full bg-blue-500/20 rotate-12 mix-blend-screen animate-pulse-fast" />
        <div className="absolute top-0 right-1/4 w-20 h-full bg-red-500/20 -rotate-12 mix-blend-screen animate-pulse-slow" />
      </div>

      {/* 狂热时的视觉干扰 (Glitch) */}
      {isPreaching && (
        <div className="absolute inset-0 bg-red-500/10 mix-blend-difference animate-flicker pointer-events-none z-0" />
      )}

      {/* 2. 前景：手中的传单 (交互核心) */}
      <div className={`
        relative z-10 w-[340px] h-[500px] bg-[#fdfbf7] shadow-2xl rotate-1 transform transition-transform duration-300
        ${showDonationBag ? 'translate-x-[-100px] scale-90 blur-[1px]' : 'hover:rotate-0 hover:scale-105'}
      `}>
        {/* 纸张纹理 */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-50" />
        
        {/* 传单内容 */}
        <div className="p-6 font-serif text-black flex flex-col h-full items-center text-center">
          {/* 标题 */}
          <div className="border-b-2 border-black w-full pb-2 mb-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter">The Salvation</h1>
            <p className="text-xs italic">Sunday Service • All Welcome</p>
          </div>

          {/* 听道按钮 */}
          <div className="mb-6 w-full cursor-pointer group" onClick={handleListenClick}>
            <h2 className="font-bold text-xl mb-1 group-hover:text-red-600 transition-colors">† TODAY'S WORD †</h2>
            <p className="text-xs text-gray-600 leading-tight group-hover:font-bold">
              "Suffering is the fuel of the soul! Burn it for Him!"
            </p>
            <div className="mt-1 text-[10px] text-red-500 font-mono opacity-0 group-hover:opacity-100">
              [ CLICK TO LISTEN ]
            </div>
          </div>

          <div className="w-full h-px bg-black/20 my-2" />

          {/* 奉献按钮 */}
          <div className="mt-auto w-full cursor-pointer group" onClick={handleDonationClick}>
             <div className="text-5xl mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform">
               {placeholderIcons.handshake}
             </div>
             <h2 className="font-bold text-lg uppercase group-hover:text-green-700">Tithing & Offering</h2>
             <p className="text-[10px] text-gray-500">Give, and you shall receive.</p>
          </div>

          <div className="mt-4 text-[8px] text-gray-400 font-mono">
            Rev. Johnson's Ministry<br/>1042 Industrial Ave.
          </div>
        </div>
      </div>

      {/* 3. 奉献袋 (点击奉献后划入) */}
      <div className={`
        absolute bottom-0 right-0 w-[400px] h-[300px] z-20 transition-transform duration-500 ease-out
        ${showDonationBag ? 'translate-y-0 translate-x-0' : 'translate-y-full translate-x-full'}
      `}>
        {/* 红丝绒袋子占位 */}
        <div className="absolute bottom-0 right-0 text-[200px] drop-shadow-[-20px_-20px_50px_rgba(0,0,0,0.5)]">
          {placeholderIcons.donation_bag}
        </div>
        
        {/* 投币选项 */}
        <div className="absolute top-1/3 left-1/4 flex flex-col gap-2">
          <button 
            onClick={() => handleGiveMoney(5)}
            disabled={gold < 5}
            className="bg-green-800 text-white font-mono text-sm px-4 py-2 rounded shadow-lg hover:bg-green-600 hover:scale-105 disabled:opacity-50 transition-all border-2 border-green-900"
          >
            $5 (Small)
          </button>
          <button 
            onClick={() => handleGiveMoney(20)}
            disabled={gold < 20}
            className="bg-green-700 text-white font-mono text-lg px-6 py-3 rounded shadow-lg hover:bg-green-500 hover:scale-105 disabled:opacity-50 transition-all border-2 border-green-900"
          >
            $20 (Blessing)
          </button>
          <button 
            onClick={() => setShowDonationBag(false)}
            className="mt-2 text-gray-300 text-xs hover:text-white underline shadow-black drop-shadow-md"
          >
            Pass the bag
          </button>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-4 right-8 text-gray-500 hover:text-white text-xs font-mono"
      >
        [LEAVE SERVICE]
      </button>

    </div>
  );
};
