import React from 'react';

// ========== VIBE CODING: Lite Background 组件 ==========
// 极简背景，没有任何 JS 动画，只有 CSS 渐变 - 禅 (Zen)
export const LiteBackground = ({ children, transparent }: { children: React.ReactNode; transparent?: boolean }) => (
  <div className={`min-h-screen w-full relative transition-colors duration-500 ${transparent ? '' : 'bg-slate-50 dark:bg-slate-950'}`}>
    {/* 静态的、优雅的渐变背景 */}
    {!transparent && (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 z-0" />
    )}
    {/* 静态噪点增加质感 */}
    <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0 pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

export default LiteBackground;
