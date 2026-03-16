/**
 * ScreenReaderAnnouncer - 屏幕阅读器消息宣布组件
 * 
 * 为视障用户提供游戏状态变化的语音反馈
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAnnouncer } from '@/hooks/useAccessibility';

/**
 * 屏幕阅读器宣布器组件
 * 放置在应用顶层，监听游戏状态变化并宣布
 */
export const ScreenReaderAnnouncer: React.FC = () => {
  const { message, politeness, announce } = useAnnouncer();
  const [prevState, setPrevState] = useState({
    gold: 0,
    hp: 0,
    turn: 0,
    eventTitle: '',
  });

  // 从游戏状态获取关键数值
  const { vitality, currentEvent, weeklyReport } = useGameStore();
  const currentGold = vitality?.metrics?.gold || 0;
  const currentHp = vitality?.metrics?.hp || 0;
  const currentTurn = vitality?.time?.currentTurn || 0;

  // 监听数值变化并宣布
  useEffect(() => {
    // 金币变化
    if (currentGold !== prevState.gold) {
      const diff = currentGold - prevState.gold;
      if (Math.abs(diff) >= 10) { // 只宣布较大变化
        announce(
          diff > 0 ? `获得 ${diff} 金币` : `失去 ${Math.abs(diff)} 金币`,
          'polite'
        );
      }
    }

    // HP变化
    if (currentHp !== prevState.hp) {
      const diff = currentHp - prevState.hp;
      if (Math.abs(diff) >= 5) { // 只宣布较大变化
        announce(
          diff > 0 ? `生命值恢复 ${diff} 点` : `受到 ${Math.abs(diff)} 点伤害`,
          diff < 0 ? 'assertive' : 'polite'
        );
      }
    }

    // 回合变化
    if (currentTurn !== prevState.turn && currentTurn > 0) {
      announce(`第 ${currentTurn} 周`, 'polite');
    }

    // 事件触发
    if (currentEvent?.title && currentEvent.title !== prevState.eventTitle) {
      announce(`触发事件：${currentEvent.title}`, 'assertive');
    }

    // 使用函数式更新，避免依赖 prevState
    setPrevState(prev => {
      // 只有实际变化时才更新
      if (prev.gold === currentGold && prev.hp === currentHp && 
          prev.turn === currentTurn && prev.eventTitle === (currentEvent?.title || '')) {
        return prev; // 返回相同引用，避免重渲染
      }
      return {
        gold: currentGold,
        hp: currentHp,
        turn: currentTurn,
        eventTitle: currentEvent?.title || '',
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGold, currentHp, currentTurn, currentEvent?.title, announce]); // 移除 prevState 依赖

  // 监听周结算
  useEffect(() => {
    if (weeklyReport) {
      announce(
        `第 ${weeklyReport.turn} 周结算完成，净变化 ${weeklyReport.netChange} 金币`,
        'polite'
      );
    }
  }, [weeklyReport, announce]);

  return (
    <>
      {/* 状态变化宣布区域 */}
      <div
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>

      {/* 游戏区域标签 */}
      <div role="application" aria-label="三国·生存游戏" className="sr-only">
        使用 Q W E R 选择事件选项，按 E 结束回合，I 打开背包，M 切换地图视图
      </div>
    </>
  );
};

/**
 * 静态ARIA标签组件
 * 为游戏UI元素提供屏幕阅读器标签
 */
export const AriaLabels: React.FC = () => (
  <>
    {/* 跳过导航链接 */}
    <a href="#main-content" className="skip-link">
      跳到主内容
    </a>

    {/* 角色状态区域标签 */}
    <div id="stats-label" className="sr-only">角色状态面板</div>
    <div id="inventory-label" className="sr-only">物品背包</div>
    <div id="map-label" className="sr-only">城市地图</div>
    <div id="event-label" className="sr-only">事件选择</div>
  </>
);

export default ScreenReaderAnnouncer;
