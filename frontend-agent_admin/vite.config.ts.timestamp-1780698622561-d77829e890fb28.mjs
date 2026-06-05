// vite.config.ts
import { defineConfig } from "file:///C:/Users/PC/IdeaProjects/CRM/frontend-agent_admin/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/PC/IdeaProjects/CRM/frontend-agent_admin/node_modules/@vitejs/plugin-react/dist/index.js";
import { TanStackRouterVite } from "file:///C:/Users/PC/IdeaProjects/CRM/frontend-agent_admin/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
import tsconfigPaths from "file:///C:/Users/PC/IdeaProjects/CRM/frontend-agent_admin/node_modules/vite-tsconfig-paths/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\PC\\IdeaProjects\\CRM\\frontend-agent_admin";
var vite_config_default = defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: "./src/routes", generatedRouteTree: "./src/routeTree.gen.ts" }),
    react(),
    tsconfigPaths()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 5176,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            const cookies = proxyRes.headers["set-cookie"];
            if (!cookies) return;
            proxyRes.headers["set-cookie"] = cookies.map(
              (cookie) => cookie.replace(/;\s*Domain=[^;]+/gi, "").replace(/;\s*Secure/gi, "")
            );
          });
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxQQ1xcXFxJZGVhUHJvamVjdHNcXFxcQ1JNXFxcXGZyb250ZW5kLWFnZW50X2FkbWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxQQ1xcXFxJZGVhUHJvamVjdHNcXFxcQ1JNXFxcXGZyb250ZW5kLWFnZW50X2FkbWluXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9QQy9JZGVhUHJvamVjdHMvQ1JNL2Zyb250ZW5kLWFnZW50X2FkbWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyBUYW5TdGFja1JvdXRlclZpdGUgfSBmcm9tICdAdGFuc3RhY2svcm91dGVyLXBsdWdpbi92aXRlJ1xyXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tICd2aXRlLXRzY29uZmlnLXBhdGhzJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICBUYW5TdGFja1JvdXRlclZpdGUoeyByb3V0ZXNEaXJlY3Rvcnk6ICcuL3NyYy9yb3V0ZXMnLCBnZW5lcmF0ZWRSb3V0ZVRyZWU6ICcuL3NyYy9yb3V0ZVRyZWUuZ2VuLnRzJyB9KSxcclxuICAgIHJlYWN0KCksXHJcbiAgICB0c2NvbmZpZ1BhdGhzKCksXHJcbiAgXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogNTE3NixcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgY29uZmlndXJlOiAocHJveHkpID0+IHtcclxuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcycsIChwcm94eVJlcykgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjb29raWVzID0gcHJveHlSZXMuaGVhZGVyc1snc2V0LWNvb2tpZSddXHJcbiAgICAgICAgICAgIGlmICghY29va2llcykgcmV0dXJuXHJcbiAgICAgICAgICAgIHByb3h5UmVzLmhlYWRlcnNbJ3NldC1jb29raWUnXSA9IGNvb2tpZXMubWFwKChjb29raWUpID0+XHJcbiAgICAgICAgICAgICAgY29va2llXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvO1xccypEb21haW49W147XSsvZ2ksICcnKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLztcXHMqU2VjdXJlL2dpLCAnJyksXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpVixTQUFTLG9CQUFvQjtBQUM5VyxPQUFPLFdBQVc7QUFDbEIsU0FBUywwQkFBMEI7QUFDbkMsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxVQUFVO0FBSmpCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLG1CQUFtQixFQUFFLGlCQUFpQixnQkFBZ0Isb0JBQW9CLHlCQUF5QixDQUFDO0FBQUEsSUFDcEcsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixXQUFXLENBQUMsVUFBVTtBQUNwQixnQkFBTSxHQUFHLFlBQVksQ0FBQyxhQUFhO0FBQ2pDLGtCQUFNLFVBQVUsU0FBUyxRQUFRLFlBQVk7QUFDN0MsZ0JBQUksQ0FBQyxRQUFTO0FBQ2QscUJBQVMsUUFBUSxZQUFZLElBQUksUUFBUTtBQUFBLGNBQUksQ0FBQyxXQUM1QyxPQUNHLFFBQVEsc0JBQXNCLEVBQUUsRUFDaEMsUUFBUSxnQkFBZ0IsRUFBRTtBQUFBLFlBQy9CO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
