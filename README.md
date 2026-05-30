# Toolkit App v2.0.4

一个功能丰富的移动端工具集合应用，基于 **React Native (Expo SDK 56)** 构建，支持 Android 和 Web 平台。

## 更新日志

### v2.0.4 — GPS 双级定位降级

**🌐 定位优化**
- GPS 高精度定位 12 秒超时后自动降级到网络定位（WiFi/基站）
- 网络定位 5 秒超时兜底，室外室内都能用
- 每步定位添加详细日志便于排查

### v2.0.1 — 高德天气 API + 性能优化

**🌤 天气服务**
- 替换 wttr.in 为高德地图 Web 服务 API，中国城市数据更准确
- API Key 通过 `src/services/gaode-config.ts` 配置（不提交到 Git）
- 新增天气数据缓存（15 分钟 TTL），页面秒开

**⚡ 性能优化**
- GPS 定位 5 秒超时降级，避免长时间等待
- 天气加载不再阻塞页面渲染

### v2.0.0 — 全局美化与导航重构

**🎨 界面美化**
- 全局紫色主题（`#7C3AED`），统一配色/圆角/间距规范
- 毛玻璃侧边栏，半透明紫色背景
- 侧边栏顶部圆形头像 "M" + "工具集" 标题 + "我的日常助手"
- 菜单项之间淡紫色分割线

**🔙 导航改进**
- 所有页面顶部均有返回首页按钮（‹ + ☰）
- 首页保留菜单按钮（☰）
- 侧边栏每个菜单恢复 emoji 图标
- 代码结构重构到 `src/navigation/` 目录

**🌤 天气**
- GPS 定位精度提升至 High
- 每 30 分钟按系统时钟对齐自动刷新
- 新增刷新按钮
- API Key 独立配置，安全可控

**📝 首页仪表盘**
- 待办栏展示最早 4 条未完成项
- 纪念日卡片显示已过天数 + 具体日期

**❤️ 纪念日**
- 卡片上展示具体日期和已过天数

## 功能

| 功能 | 说明 |
|------|------|
| 📝 **便签** | 创建、编辑、删除便签，支持颜色标签，卡片式布局 |
| ✅ **待办** | 添加待办事项，勾选完成，进度条显示完成率，首页展示最早 4 条未完成项 |
| 🌤 **天气** | 实时天气查询，GPS 定位 + 城市搜索，可收藏常用城市，5 天预报 |
| ⏱ **倒计时** | 设置目标日期，主页显示最近倒计时剩余天数 |
| 🎂 **生日** | 记录亲友生日，显示倒计时天数，按时间排序 |
| ❤️ **纪念日** | 记录重要日期，显示日期、已过天数和下次倒计时 |
| 🔒 **密码本** | 4 位数字 PIN 码保护，存储和管理账号密码，支持显示/隐藏 |

## 技术栈

- **框架**: React Native (Expo SDK 56)
- **导航**: React Navigation v7 (Drawer + Native Stack)
- **存储**: AsyncStorage（本地持久化）
- **定位**: expo-location
- **天气**: 高德地图 Web 服务 API
- **日期选择**: @react-native-community/datetimepicker
- **主题**: 紫色系毛玻璃风格，统一间距/圆角规范

## 快速开始

```bash
# 安装依赖
npm install

# 配置天气 API Key
cp src/services/gaode-config.example.ts src/services/gaode-config.ts
# 然后编辑 gaode-config.ts 填入你的高德 Web 服务 API Key

# 启动 Web 版
npx expo start --web

# 启动 Android
npx expo start --android
```

## 构建 APK

```bash
# 需要 Expo 账号
npx eas build -p android --profile preview
```

## 项目结构

```
src/
├── components/     # 通用组件 (Card, DrawerContent, DatePickerField)
├── constants/      # 主题常量 (Colors, Layout)
├── navigation/     # 导航配置 (DrawerNavigator, Stack navigators)
├── screens/        # 功能页面
├── services/       # 外部 API 服务 (weather)
├── storage/        # AsyncStorage 数据持久化
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数 (dates)
```
