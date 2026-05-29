# Toolkit App

一个功能丰富的移动端工具集合应用，基于 **React Native (Expo SDK 56)** 构建，支持 Android 和 Web 平台。

## v2 新特性

- **🎨 全局紫色主题** — 主色 `#7C3AED`，统一配色、圆角、间距规范
- **🪟 毛玻璃侧边栏** — 半透明紫色背景，顶部圆形头像 + "工具集" 标题，菜单项带淡紫分割线
- **🔙 全局返回导航** — 所有页面顶部均有返回首页按钮（‹ + ☰），首页保留菜单按钮
- **🔄 天气自动刷新** — 每 30 分钟按系统时钟对齐刷新，支持 GPS → IP 定位降级

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
- **天气**: wttr.in API（无需 API Key）
- **日期选择**: @react-native-community/datetimepicker
- **主题**: 紫色系毛玻璃风格，统一间距/圆角规范

## 快速开始

```bash
# 安装依赖
npm install

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
