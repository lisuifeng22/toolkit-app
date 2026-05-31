# Toolkit App v2.0.6

一个功能丰富的移动端工具集合应用，基于 **React Native (Expo SDK 56)** 构建，支持 Android 和 Web 平台。

> **隐私说明**: 请参阅 [PRIVACY.md](PRIVACY.md) 了解本 App 的权限使用、数据处理和安全边界。

## 环境要求

- **Node.js**: >= 18.x (推荐 20.x LTS)
- **npm**: >= 9.x 或 **pnpm** >= 8.x
- **Expo CLI**: 已集成在项目中，无需全局安装
- **EAS CLI**: 如需构建 APK，安装 `npm install -g eas-cli`

## 安装与配置

```bash
# 安装依赖
npm install

# 配置高德 API Key
cp src/services/gaode-config.example.ts src/services/gaode-config.ts
# 编辑 gaode-config.ts 填入你的高德 Web 服务 API Key
```

### API Key 安全说明

- **不要提交真实 API Key** — `src/services/gaode-config.ts` 已被 .gitignore 忽略
- 高德 API Key 建议在 [高德开放平台](https://lbs.amap.com/) 限制调用来源（Android 包名 / Web 域名）和调用配额
- 客户端 API Key 不能视为绝对保密，应避免使用该 Key 调用敏感接口

## 本地启动

```bash
# Web 版
npm start
npx expo start --web

# Android
npm run android

# iOS
npm run ios
```

## 质量检查

```bash
# TypeScript 类型检查
npm run typecheck

# ESLint 代码检查
npm run lint

# Prettier 格式化
npm run format
```

## 构建 APK

```bash
# 需要 Expo 账号
npx eas build -p android --profile preview
```

## 功能

| 功能          | 说明                                                                |
| ------------- | ------------------------------------------------------------------- |
| 📝 **便签**   | 创建、编辑、删除便签，支持颜色标签，卡片式布局                      |
| ✅ **待办**   | 添加待办事项，勾选完成，进度条显示完成率，首页展示最早 4 条未完成项 |
| 🌤 **天气**   | 实时天气查询，GPS 定位 + 城市搜索，可收藏常用城市，5 天预报         |
| ⏱ **倒计时**  | 设置目标日期，主页显示最近倒计时剩余天数                            |
| 🎂 **生日**   | 记录亲友生日，显示倒计时天数，按时间排序                            |
| ❤️ **纪念日** | 记录重要日期，显示日期、已过天数和下次倒计时                        |
| 🔒 **密码本** | 4 位数字 PIN 码保护，加密存储账号密码，支持显示/隐藏                |

## 技术栈

- **框架**: React Native (Expo SDK 56)
- **导航**: React Navigation v7 (Drawer + Native Stack)
- **存储**: AsyncStorage（本地持久化）+ expo-sqlite
- **定位**: expo-location
- **天气**: 高德地图 Web 服务 API
- **加密**: expo-crypto + expo-secure-store (密码本)
- **日期选择**: @react-native-community/datetimepicker
- **主题**: 紫色系毛玻璃风格，统一间距/圆角规范

## 安全说明

- **密码本**: 所有密码数据使用 AES-GCM 加密后本地存储，PIN 码通过 PBKDF2 派生密钥
- **API Key**: 高德 API Key 仅限客户端调用天气和地理编码接口，已在 .gitignore 中排除
- **本地数据**: 所有数据仅保存在设备本地，App 不主动收集或上传用户数据
- **卸载风险**: 卸载 App 会导致所有本地数据丢失，建议定期备份

## 常见问题

<details>
<summary><b>定位权限失败</b></summary>

Android 需要授予「位置」权限。如果首次拒绝，可以前往系统设置 > 应用 > 工具集 > 权限中开启。如果用户拒绝定位权限，App 会使用 IP 定位兜底，精度为城市级别。

</details>

<details>
<summary><b>Android 模拟器定位不准</b></summary>

模拟器默认位置在美国。可以在模拟器扩展控制中设置 GPS 坐标，或直接搜索城市获取天气。

</details>

<details>
<summary><b>高德 Key 无效</b></summary>

检查 `src/services/gaode-config.ts` 中 `AMAP_KEY` 是否填写正确。高德 Web 服务 API Key 需在[高德开放平台](https://lbs.amap.com/)申请。注意 Web 服务 Key 和 Android/iOS SDK Key 是不同类型的 Key。

</details>

<details>
<summary><b>Web 端定位限制</b></summary>

Web 端定位依赖浏览器 Geolocation API，需要 HTTPS 环境。本地开发时 `http://localhost` 也可使用。如果浏览器拒绝定位，会自动使用 IP 定位兜底。

</details>

<details>
<summary><b>天气接口请求失败</b></summary>

高德天气 API 存在 QPS 限制，频繁刷新可能返回 "配额不足" 错误。等待 1 分钟后重试即可。长时间失败请检查 API Key 是否有效。

</details>

## 项目结构

```
src/
├── components/     # 通用组件 (Card, DrawerContent, DatePickerField)
├── constants/      # 主题常量 (Colors, Layout)
├── navigation/     # 导航配置 (DrawerNavigator, Stack navigators)
├── screens/        # 功能页面
├── services/       # 外部 API 服务 (weather)
├── storage/        # 数据持久化层
├── types/          # TypeScript 类型定义
├── theme/          # 主题配置
└── utils/          # 工具函数 (dates)
```

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)。
