import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  const isDev = mode === 'development';
  const apiTarget = env.VITE_API_BASE || 'http://localhost:3001';

  return {
    plugins: [react()],
    
    // 定义全局常量
    define: {
      __DEV__: isDev,
      __PROD__: !isDev,
    },
    
    server: {
      port: 5173,
      host: true,
      // 开发环境代理配置
      proxy: isDev ? {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      } : undefined,
    },
    
    build: {
      // 生产环境优化
      minify: 'terser',
      terserOptions: {
        compress: {
          // 生产环境移除 console.log
          drop_console: !isDev,
          drop_debugger: !isDev,
        },
      },
      // 分包策略
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'motion': ['framer-motion'],
            'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          },
        },
      },
    },
    
    // 预览服务器配置（用于本地预览生产构建）
    preview: {
      port: 3000,
      host: true,
    },
  };
});
