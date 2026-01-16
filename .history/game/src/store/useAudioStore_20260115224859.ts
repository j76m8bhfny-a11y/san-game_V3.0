import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

// --- 音频资产配置表 ---
const AUDIO_ASSETS = {
  // BGM
  bgm_title: '/assets/audio/bgm_title.mp3',      // 标题界面：空灵、电子
  bgm_blue: '/assets/audio/bgm_blue_pill.mp3',   // 蓝药丸：电梯音乐、甚至有点温馨
  bgm_cracks: '/assets/audio/bgm_cracks.mp3',    // 裂痕：带有轻微电流声的工业噪音
  bgm_old: '/assets/audio/bgm_old_ruler.mp3',    // 古神：低频嗡嗡声、心跳、不可名状
  
  // SFX
  sfx_click: '/assets/audio/sfx_click.mp3',      // 通用点击：清脆的机械开关声
  sfx_hover: '/assets/audio/sfx_hover.mp3',      // 悬停：微弱的高频信号
  sfx_cash: '/assets/audio/sfx_cash.mp3',        // 收钱/花钱：收银机声
  sfx_paper: '/assets/audio/sfx_paper.mp3',      // 账单/档案：撕纸声或翻页声
  sfx_glitch: '/assets/audio/sfx_glitch.mp3',    // 故障：刺耳的数字噪音
  sfx_typing: '/assets/audio/sfx_typing.mp3',    // 打字机：文本输出声
  sfx_heartbeat: '/assets/audio/sfx_heartbeat.mp3' // 低血量警报
};

type AudioKey = keyof typeof AUDIO_ASSETS;

interface AudioState {
  volume: number;      // 0-100
  muted: boolean;
  currentBgmKey: AudioKey | null;
}

interface AudioActions {
  setVolume: (val: number) => void;
  toggleMute: () => void;
  playSfx: (key: AudioKey) => void;
  playBgm: (key: AudioKey) => void;
  stopBgm: () => void;
}

// 内部变量：保存 Audio 实例，不存入 Zustand 以免序列化问题
let bgmInstance: HTMLAudioElement | null = null;
const sfxPool: HTMLAudioElement[] = []; // 简单的对象池（可选，这里简化为直接创建）

export const useAudioStore = create<AudioState & AudioActions>()(
  devtools(
    persist(
      (set, get) => ({
        volume: 50,
        muted: false,
        currentBgmKey: null,

        setVolume: (val) => {
          const v = Math.max(0, Math.min(100, val));
          set({ volume: v });
          // 实时应用音量
          if (bgmInstance) bgmInstance.volume = (v / 100);
        },

        toggleMute: () => {
          const newMuted = !get().muted;
          set({ muted: newMuted });
          if (bgmInstance) bgmInstance.muted = newMuted;
        },

        playSfx: (key) => {
          const { volume, muted } = get();
          if (muted || volume === 0) return;

          try {
            const audio = new Audio(AUDIO_ASSETS[key]);
            audio.volume = volume / 100;
            audio.play().catch(e => console.warn('SFX play failed:', e));
          } catch (e) {
            console.warn(`Audio asset missing: ${key}`);
          }
        },

        playBgm: (key) => {
          const { currentBgmKey, volume, muted } = get();
          
          // 如果已经在播放同一首，则忽略
          if (currentBgmKey === key && bgmInstance && !bgmInstance.paused) return;

          // 停止上一首
          if (bgmInstance) {
            bgmInstance.pause();
            bgmInstance.currentTime = 0;
          }

          try {
            const audio = new Audio(AUDIO_ASSETS[key]);
            audio.loop = true; // BGM 循环
            audio.volume = volume / 100;
            audio.muted = muted;
            
            // 尝试播放 (浏览器可能拦截自动播放，需要用户交互)
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.warn('BGM Auto-play prevented:', error);
              });
            }

            bgmInstance = audio;
            set({ currentBgmKey: key });
          } catch (e) {
            console.warn(`BGM asset missing: ${key}`);
          }
        },

        stopBgm: () => {
          if (bgmInstance) {
            bgmInstance.pause();
            bgmInstance.currentTime = 0;
            bgmInstance = null;
            set({ currentBgmKey: null });
          }
        }
      }),
      {
        name: 'american-insight-audio',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ volume: state.volume, muted: state.muted }), // 只持久化设置，不持久化播放状态
      }
    ),
    { name: 'AudioStore' }
  )
);