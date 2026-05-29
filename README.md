# Toolkit App

一个功能丰富的移动端工具集合应用，基于 **React Native (Expo SDK 56)** 构建，支持 Android 和 Web 平台。

## 功能

| 功能 | 说明 |
|------|------|
| 📝 **便签** | 创建、编辑、删除便签，支持颜色标签，卡片式布局 |
| ✅ **待办** | 添加待办事项，勾选完成，进度条显示整体完成率 |
| 🌤 **天气** | 实时天气查询，支持 GPS 定位和城市搜索，可收藏常用城市，5 天预报 |
| ⏱ **倒计时** | 设置目标日期，主页显示最近倒计时 |
| 🎂 **生日** | 记录亲友生日，显示倒计时天数，按时间排序 |
| ❤️ **纪念日** | 记录重要日期，显示已过天数和下次倒计时 |
| 🔒 **密码本** | 4 位数字 PIN 码保护，存储和管理账号密码，支持显示/隐藏 |

## 技术栈

- **框架**: React Native (Expo SDK 56)
- **导航**: React Navigation v7 (Drawer + Native Stack)
- **存储**: AsyncStorage（本地持久化）
- **定位**: expo-location
- **天气**: wttr.in API（无需 API Key）
- **日期选择**: @react-native-community/datetimepicker
- **主题**: Material You 风格，暖色系圆角卡片

## 截图

| 首页 | 天气 | 便签 |
|------|------|------|
| 导航抽屉 + 功能卡片仪表盘 | 实时天气 + 5天预报 + 城市收藏 | 双列卡片 + 颜色标签 |

| 待办 | 倒计时 | 密码本 |
|------|--------|--------|
| 进度条 + 勾选列表 | 大数字倒计时 | PIN 码保护 + 密码管理 |

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
├── components/    # 通用组件 (Card, DrawerContent, DatePickerField)
├── screens/       # 功能页面
├── services/      # 外部 API 服务 (weather)
├── storage/       # AsyncStorage 数据持久化
├── theme/         # 主题配置 (colors, spacing, fontSize)
├── types/         # TypeScript 类型定义
└── utils/         # 工具函数 (dates)
```
