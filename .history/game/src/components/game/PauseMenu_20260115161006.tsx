import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onRestart,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-64 bg-neutral-900 border-2 border-white p-1 shadow-[4px_4px_0px_#ffffff]"
          >
            {/* DOS 风格标题栏 */}
            <div className="bg-white text-black font-pixel px-2 py-1 mb-4 flex justify-between items-center select-none">
              <span>SYSTEM_MENU.EXE</span>
              <button onClick={onResume} className="hover:bg-black hover:text-white px-1">X</button>
            </div>

            <div className="flex flex-col gap-2 p-2 font-pixel">
              <button 
                onClick={onResume}
                className="w-full text-left px-2 py-2 text-white hover:bg-white hover:text-black transition-colors"
              >
                {'>'} RESUME
              </button>
              
              <button 
                onClick={onRestart}
                className="w-full text-left px-2 py-2 text-red-400 hover:bg-red-500 hover:text-white transition-colors border-t border-gray-700 mt-2 pt-3"
              >
                {'>'} REBOOT_SYSTEM (RESET)
              </button>
            </div>
            
            <div className="mt-4 text-[10px] text-gray-500 text-center font-mono">
              MEM: 640KB OK
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};