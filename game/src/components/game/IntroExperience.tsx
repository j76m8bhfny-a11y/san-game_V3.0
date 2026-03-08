/**
 * IntroExperience - 开场引导体验
 * 
 * 为新玩家提供沉浸式的游戏入门体验：
 * 1. 世界观引入 - 用叙事方式介绍游戏背景
 * 2. 核心机制教学 - 互动式学习HP/饥饿/灵视/生存率
 * 3. 操作指引 - 实际演示如何移动、工作、购买
 * 
 * 首次游玩时自动显示，可在设置中跳过
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Brain, UtensilsCrossed, Target, ChevronRight, SkipForward, Play } from 'lucide-react';

interface IntroExperienceProps {
  onComplete: () => void;
}

type IntroStep = 
  | 'welcome'      // 欢迎
  | 'story'        // 世界观
  | 'hp'           // 生命值教学
  | 'hunger'       // 饥饿教学
  | 'insight'      // 灵视教学
  | 'survival'     // 生存率教学
  | 'tutorial'     // 操作演示
  | 'ready';       // 准备开始

interface StepContent {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export const IntroExperience: React.FC<IntroExperienceProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<IntroStep>('welcome');
  const [isSkipped, setIsSkipped] = useState(false);
  
  const steps: IntroStep[] = ['welcome', 'story', 'hp', 'hunger', 'insight', 'survival', 'ready'];
  const currentIndex = steps.indexOf(currentStep);
  
  // 检查是否是第一次游玩
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('has_seen_intro');
    if (hasSeenIntro === 'true') {
      // 非首次玩家直接跳过
      onComplete();
    } else {
      // 首次玩家立即标记，防止刷新后重复显示
      localStorage.setItem('has_seen_intro', 'true');
    }
  }, [onComplete]);
  
  const nextStep = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      completeIntro();
    }
  };
  
  const skipIntro = () => {
    setIsSkipped(true);
    setTimeout(() => {
      completeIntro();
    }, 500);
  };
  
  const completeIntro = () => {
    localStorage.setItem('has_seen_intro', 'true');
    onComplete();
  };
  
  // 各步骤内容
  const getStepContent = (step: IntroStep): StepContent => {
    switch (step) {
      case 'welcome':
        return {
          title: 'AMERICAN INSIGHT',
          subtitle: '异化生存',
          content: (
            <div className="text-center space-y-6">
              <p className="text-gray-300 text-lg">
                你即将进入一个残酷的世界。
              </p>
              <p className="text-gray-400">
                这里没有英雄，只有幸存者。<br/>
                每一次选择都可能带来生存或死亡。
              </p>
              <div className="text-sm text-gray-500 mt-8">
                预计用时：3分钟
              </div>
            </div>
          ),
        };
        
      case 'story':
        return {
          title: '你的处境',
          subtitle: '第0周',
          content: (
            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                你在这个国家醒来，没有身份，没有背景，只有<span className="text-red-400">一周的时间</span>活下去。
              </p>
              <p className="text-gray-400 leading-relaxed">
                你需要工作赚钱、购买食物、寻找住所、应对各种事件。
              </p>
              <p className="text-gray-400 leading-relaxed">
                每一周结束时，系统会计算你的<span className="text-cyan-400">生存率</span>。
                如果运气不好，你可能会死亡——然后<span className="text-purple-400">重新开始</span>。
              </p>
              <div className="mt-6 p-4 bg-gray-800/50 rounded-sm border border-gray-700">
                <p className="text-sm text-gray-500">
                  💡 但不用担心，你解锁的档案会保留下来，让你在下一轮变得更强大。
                </p>
              </div>
            </div>
          ),
        };
        
      case 'hp':
        return {
          title: '生命值 (HP)',
          subtitle: '你的肉体',
          icon: <Heart className="w-12 h-12 text-red-500" />,
          content: (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-4 bg-gray-800 rounded-sm overflow-hidden">
                  <div className="w-3/4 h-full bg-red-500 rounded-sm" />
                </div>
                <span className="text-red-400 font-mono">75/100</span>
              </div>
              <p className="text-gray-300">
                <span className="text-red-400 font-bold">HP归零 = 死亡</span>
              </p>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>• 受伤会减少HP</li>
                <li>• 有住所可以缓慢恢复HP</li>
                <li>• 医疗物品可以立即恢复</li>
                <li>• <span className="text-red-400">HP低于25%时屏幕会变红</span>，表示危险</li>
              </ul>
            </div>
          ),
        };
        
      case 'hunger':
        return {
          title: '饥饿度',
          subtitle: '你的胃',
          icon: <UtensilsCrossed className="w-12 h-12 text-orange-500" />,
          content: (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-4 bg-gray-800 rounded-sm overflow-hidden">
                  <div className="w-1/2 h-full bg-orange-500 rounded-sm" />
                </div>
                <span className="text-orange-400 font-mono">50/100</span>
              </div>
              <p className="text-gray-300">
                饥饿度会<span className="text-orange-400">每周自动增加</span>。
              </p>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>• 饥饿度越高，身体越虚弱</li>
                <li>• 超过75%会持续损失HP</li>
                <li>• 去商店购买食物可以降低饥饿</li>
                <li>• <span className="text-orange-400">不同食物效果不同</span>，价格也不同</li>
              </ul>
            </div>
          ),
        };
        
      case 'insight':
        return {
          title: '灵视 (Insight)',
          subtitle: '你的眼睛',
          icon: <Brain className="w-12 h-12 text-purple-500" />,
          content: (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-4 bg-gray-800 rounded-sm overflow-hidden">
                  <div className="w-1/3 h-full bg-purple-500 rounded-sm" />
                </div>
                <span className="text-purple-400 font-mono">35/100</span>
              </div>
              <p className="text-gray-300">
                灵视代表你能看到多少<span className="text-purple-400">隐藏的真相</span>。
              </p>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>• 灵视越高，能看到的信息越多</li>
                <li>• 某些特殊选项需要灵视达到阈值才能看到</li>
                <li>• 灵视可以透过物品、事件、信仰提升</li>
                <li>• <span className="text-purple-400">追求真相有代价</span>，小心平衡</li>
              </ul>
            </div>
          ),
        };
        
      case 'survival':
        return {
          title: '生存率',
          subtitle: '你的命运',
          icon: <Target className="w-12 h-12 text-cyan-500" />,
          content: (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#374151" strokeWidth="8" fill="none" />
                    <circle cx="48" cy="48" r="40" stroke="#06b6d4" strokeWidth="8" fill="none"
                      strokeDasharray={`${0.65 * 251} 251`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-xl">65%</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-300">
                屏幕角落会显示你的<span className="text-cyan-400">本周生存率</span>。
              </p>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>• 基于你的HP、饥饿、住所、疾病等综合计算</li>
                <li>• <span className="text-green-400">绿色</span> = 安全 (&gt;80%)</li>
                <li>• <span className="text-yellow-400">黄色</span> = 警告 (50-80%)</li>
                <li>• <span className="text-red-400">红色</span> = 危险 (&lt;50%)</li>
              </ul>
            </div>
          ),
        };
        
      case 'ready':
        return {
          title: '准备好了吗？',
          subtitle: '选择你的阶级',
          content: (
            <div className="space-y-4">
              <p className="text-gray-300">
                现在，你需要选择一个<span className="text-white font-bold">阶级</span>作为起点：
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                  <div className="text-gray-400 text-sm font-bold">流浪汉</div>
                  <div className="text-xs text-gray-500">地狱开局，但最了解街头</div>
                </div>
                <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                  <div className="text-blue-400 text-sm font-bold">工人</div>
                  <div className="text-xs text-gray-500">有工作，但很辛苦</div>
                </div>
                <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                  <div className="text-purple-400 text-sm font-bold">中产</div>
                  <div className="text-xs text-gray-500">稳定，但有陷阱</div>
                </div>
                <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                  <div className="text-yellow-400 text-sm font-bold">资本家</div>
                  <div className="text-xs text-gray-500">资源丰富，代价未知</div>
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-4">
                阶级决定起点，但不决定终点。每个阶级都有独特的玩法和挑战。
              </p>
            </div>
          ),
        };
        
      default:
        return { title: '', content: null };
    }
  };
  
  const stepContent = getStepContent(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;
  
  return (
    <AnimatePresence mode="wait">
      {!isSkipped && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4"
        >
          {/* 背景 */}
          <div className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-transparent to-transparent" />
          
          {/* 内容容器 */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-lg"
          >
            {/* 进度条 */}
            <div className="absolute -top-8 left-0 right-0">
              <div className="h-1 bg-gray-800 rounded-sm overflow-hidden">
                <motion.div
                  className="h-full bg-pixel-gradient-cyan"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>引导</span>
                <span>{currentIndex + 1} / {steps.length}</span>
              </div>
            </div>
            
            {/* 主卡片 */}
            <div className="bg-gray-900/90 border border-gray-700 rounded-sm p-8 shadow-pixel">
              {/* 图标（如果有） */}
              {stepContent.icon && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="flex justify-center mb-6"
                >
                  <div className="p-4 bg-gray-800 rounded-sm">
                    {stepContent.icon}
                  </div>
                </motion.div>
              )}
              
              {/* 标题 */}
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
                  {stepContent.title}
                </h2>
                {stepContent.subtitle && (
                  <p className="text-cyan-400 text-sm">{stepContent.subtitle}</p>
                )}
              </div>
              
              {/* 内容 */}
              <div className="mb-8">
                {stepContent.content}
              </div>
              
              {/* 按钮区 */}
              <div className="flex items-center justify-between">
                <button
                  onClick={skipIntro}
                  className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  跳过引导
                </button>
                
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-pixel-gradient-cyan 
                           hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-sm
                           transition-all shadow-pixel-sm shadow-cyan-500/20"
                >
                  {currentStep === 'ready' ? (
                    <>
                      <Play className="w-5 h-5" />
                      开始游戏
                    </>
                  ) : (
                    <>
                      下一步
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroExperience;
