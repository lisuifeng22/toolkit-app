# 更新日志

## v2.0.6 (2026-05-31)

### ⚠️ 安全整改

- **密码本加密重构**: 密码数据不再明文存储
  - 引入 AES-256-CTR + HMAC-SHA256 加密方案 (Encrypt-then-MAC)
  - PIN 码验证使用 PBKDF2-HMAC-SHA256 (100000 轮) 派生
  - 每个 PIN 使用独立盐值, 消除彩虹表攻击风险
  - 使用 expo-secure-store 存储敏感密钥材料
  - 旧版明文密码数据检测与自动迁移
  - 迁移成功后自动删除旧明文数据
  - 迁移失败给出明确错误提示
- **PIN 冷却锁定机制**:
  - 连续 5 次输错后进入 5 分钟冷却期
  - 冷却状态通过 SecureStore 持久化
  - 关闭 App 重新打开仍处于锁定状态
  - 冷却期间键盘禁用, 显示倒计时
- **安全提示**: 密码本 UI 增加加密状态横幅和安全提醒
- **高德 API Key 安全**: .gitignore 排除 `src/services/gaode-config.ts`, 移除 Git 追踪

### 🌤 天气定位优化

- 天气数据增加 `source` 字段, 区分 GPS / 低精度 / IP 定位 / 手动搜索
- UI 显示定位来源标签和精度提示
- 缓存按城市 adcode + 来源分别存储, 避免手动搜索和自动定位互相覆盖
- IP 定位成功时提示"已使用 IP 定位结果, 可能不够精确"
- 高德 API 错误码转成用户可理解的提示 (Key 无效、配额不足、城市不存在等)
- 错误信息不再仅显示原始 `data.info`

### 🛠 工程化改进

- 统一版本号为 2.0.6 (package.json / app.json / README)
- 新增工程质量脚本:
  - `npm run typecheck` — TypeScript 检查
  - `npm run lint` — ESLint 代码检查
  - `npm run format` — Prettier 格式检查
  - `npm run format:write` — Prettier 自动格式化
- 新增 ESLint 配置 (支持 React Native、React Hooks、TypeScript)
- 新增 Prettier 配置
- 移除无用变量 `colorMap`

### 🗄 存储层整理

- 所有 AsyncStorage key 集中定义在 `src/storage/index.ts`
- 增加 `loadJson` / `saveJson` 通用工具函数
- 统一的 JSON.parse 容错和数据类型校验
- 引入存储版本号 (`@toolkit_storage_version`) 和 migration 入口
- weather-locations 改用集中式存储工具

### 📖 文档补充

- 新增 [PRIVACY.md](PRIVACY.md) 隐私说明
- 新增 [CHANGELOG.md](CHANGELOG.md) 更新日志
- README 补充:
  - 环境要求 (Node.js / npm / Expo CLI)
  - 安装与配置指南
  - API Key 安全说明
  - 质量检查命令
  - 安全使用说明
  - 常见问题 (FAQ)
  - 隐私说明入口链接

---

## v2.0.5 — GPS 并行双定位

**🌐 定位优化**

- GPS 高精度和网络定位并行发起, 5 秒内 GPS 返回则优先使用, 超时自动使用网络定位
- 最慢 5 秒出结果（之前串行最慢 17 秒）

## v2.0.4 — GPS 双级定位降级

**🌐 定位优化**

- GPS 高精度定位 12 秒超时后自动降级到网络定位 (WiFi/基站)
- 网络定位 5 秒超时兜底
- 每步定位添加详细日志便于排查

## v2.0.1 — 高德天气 API + 性能优化

**🌤 天气服务**

- 替换 wttr.in 为高德地图 Web 服务 API
- API Key 通过 `src/services/gaode-config.ts` 配置（不提交到 Git）
- 新增天气数据缓存（15 分钟 TTL）

**⚡ 性能优化**

- GPS 定位 5 秒超时降级
- 天气加载不再阻塞页面渲染

## v2.0.0 — 全局美化与导航重构

**🎨 界面美化**

- 全局紫色主题（`#7C3AED`）, 统一配色/圆角/间距规范
- 毛玻璃侧边栏

**🔙 导航改进**

- 所有页面顶部均有返回首页按钮
- 代码结构重构到 `src/navigation/` 目录

**🌤 天气**

- GPS 定位精度提升至 High
- 每 30 分钟按系统时钟对齐自动刷新
- API Key 独立配置

**📝 首页仪表盘**

- 待办栏展示最早 4 条未完成项
- 纪念日卡片显示已过天数 + 具体日期
