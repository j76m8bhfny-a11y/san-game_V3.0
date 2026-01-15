// src/store/useAudioStore.ts
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

// 1. 定义 Audio State 接口
interface AudioState {
  volume: number;      // 音量 (0-100)
  muted: boolean;       // 是否静音
}

// 2. 定义 Actions 接口
interface AudioActions {
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  play: (id: string) => void;
}

// 合并 State 和 Actions
type AudioStore = AudioState & AudioActions;

// 3. 初始状态
const INITIAL_STATE: AudioState = {
  volume: 50,    // 默认音量 50%
  muted: false,  // 默认不静音
};

// 4. 版本控制
const STORE_VERSION = 1;

// 5. Store 实现
export const useAudioStore = create<AudioStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        // 设置音量
        setVolume: (volume: number) => {
          const clampedVolume = Math.max(0, Math.min(100, volume));
          set({ volume: clampedVolume });
        },

        // 切换静音状态
        toggleMute: () => {
          set((state) => ({ muted: !state.muted }));
        },

        // 播放音频 (占位实现，避免文件缺失时崩溃)
        play: (id: string) => {
          console.log('🎵 Audio:', id);
          // TODO: 后续集成 Howler.js 实现真实音频播放
        },
      }),
      {
        name: 'american-insight-audio-storage',
        version: STORE_VERSION,
        storage: createJSONStorage(() => localStorage),

        migrate: (persistedState: any, version) => {
          if (version !== STORE_VERSION) {
            console.warn(`[AudioStore] Version mismatch. Resetting state.`);
            return INITIAL_STATE as any;
          }
          return persistedState as AudioStore;
        },
      }
    ),
    { name: 'AudioStore' }
  )
);

// 👇 调试挂载
(window as any).audio = useAudioStore;
