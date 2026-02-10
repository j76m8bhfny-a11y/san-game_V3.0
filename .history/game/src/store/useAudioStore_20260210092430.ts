import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
// ✅ 1. 引入系统配置 (Source of Truth)
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// --- 音频资产配置表 ---
const AUDIO_ASSETS = {
  // === BGM ===
  bgm_title: '/assets/audio/bgm_title.mp3',      // 标题界面
  bgm_blue: '/assets/audio/bgm_blue_pill.mp3',   // 蓝药丸
  bgm_cracks: '/assets/audio/bgm_cracks.mp3',    // 裂痕
  bgm_old: '/assets/audio/bgm_old_ruler.mp3',    // 古神
  
  // === 基础 SFX ===
  sfx_click: '/assets/audio/sfx_click.mp3',      // 点击
  sfx_hover: '/assets/audio/sfx_hover.mp3',      // 悬停
  sfx_cash: '/assets/audio/sfx_cash.mp3',        // 金钱
  sfx_paper: '/assets/audio/sfx_paper.mp3',      // 纸张
  sfx_glitch: '/assets/audio/sfx_glitch.mp3',    // 故障
  sfx_typing: '/assets/audio/sfx_typing.mp3',    // 打字
  sfx_heartbeat: '/assets/audio/sfx_heartbeat.mp3', // 心跳
  sfx_deny: '/assets/audio/sfx_deny.mp3',         // 拒绝/错误

  // === ✅ 新增：住房系统 SFX (修复报错) ===
  // 贫民窟
  sfx_fabric_heavy: '/assets/audio/sfx_fabric_heavy.mp3', // 搭建帐篷/布料声
  sfx_trash: '/assets/audio/sfx_trash.mp3',               // 拆除/垃圾声
  sfx_snore: '/assets/audio/sfx_snore.mp3',               // 睡觉打呼

  // 铁锈区
  sfx_keys_jingle: '/assets/audio/sfx_keys_jingle.mp3',   // 钥匙晃动
  sfx_neon_hum: '/assets/audio/sfx_neon_hum.mp3',         // 霓虹灯电流声

  // 郊区
  sfx_print_receipt: '/assets/audio/sfx_print_receipt.mp3', // 打印合同/收据
  sfx_pen_scratch: '/assets/audio/sfx_pen_scratch.mp3',     // 签字笔书写
  sfx_bird_chirp: '/assets/audio/sfx_bird_chirp.mp3',       // 鸟叫/环境音

  // 核心区
  sfx_sci_fi_door: '/assets/audio/sfx_sci_fi_door.mp3',     // 高科技门
  sfx_ambient_drone: '/assets/audio/sfx_ambient_drone.mp3', // 低沉氛围音
  sfx_glass_clink: '/assets/audio/sfx_glass_clink.mp3',     // 碰杯声
};

// 自动推导类型：现在包含了上面新增的所有 Key
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

export const useAudioStore = create<AudioState & AudioActions>()(
  devtools(
    persist(
      (set, get) => ({
        // ✅ 2. 使用配置中的默认音量 (如 JSON 未加载则兜底 50)
        volume: SYSTEM_RULES.audio?.defaultVolume ?? 50,
        muted: false,
        currentBgmKey: null,

        setVolume: (val) => {
          // 钳制范围 0-100
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
            // 这里可能会因为文件不存在报 404，但在开发阶段不影响代码运行
            const audio = new Audio(AUDIO_ASSETS[key]);
            audio.volume = volume / 100;
            audio.play().catch(e => {
              // 忽略因为没有用户交互导致的播放失败，或者文件缺失
              // console.warn('SFX play failed:', e) 
            });
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
        // 只持久化设置 (Volume, Muted)，不持久化播放状态 (BGM Key)
        partialize: (state) => ({ volume: state.volume, muted: state.muted }), 
      }
    ),
    { name: 'AudioStore' }
  )
);