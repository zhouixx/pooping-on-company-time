# 多端口互动流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将带薪摸鱼单页拆成五个按端口访问的互动步骤，并在 05 页显示跨会话的今日累计收益。

**Architecture:** React 应用根据 `window.location.port` 选择步骤，公共品牌头和步骤导航在五个端口复用。设置与计时状态写入 `Path=/` Cookie，读取时迁移旧 `localStorage`；计时器状态记录当天累计收益、当前日期和已结束会话收益。

**Tech Stack:** React、TypeScript、Vite、Vitest、Testing Library、现有 CSS 与 `lucide-react`。

**Execution status:** Complete. 当前工作目录不是 Git 仓库，因此未执行计划中的提交动作。

## Global Constraints

- 端口映射固定为 5173/5174/5175/5176/5177 对应 01/02/03/04/05。
- 设置和计时状态必须能在同一主机的不同端口之间读取。
- 今日已赚 = 当天已结束会话累计收益 + 当前运行/暂停会话收益；跨自然日清零。
- 结束会话后按结束时薪锁定本次收益；重置当前会话不清除当天累计。
- 保留既有节假日、工作日、薪资、结算单位和非工作日禁用规则。
- 不新增后端或敏感数据；`npm run build`、`npm test` 必须通过。

---

### Task 1: 端口步骤映射与导航

**Files:**
- Create: `src/domain/steps.ts`
- Create: `src/components/StepNavigation.tsx`
- Test: `src/domain/__tests__/steps.test.ts`

**Interfaces:**
- `getStepFromPort(port?: string | number): AppStep`
- `getStepUrl(step: AppStep, hostname?: string): string`
- `StepNavigation` renders five step links and previous/next links.

- [ ] 写端口映射失败测试，覆盖未知端口回到 01、5173～5177 映射和 URL 生成。
- [ ] 运行 `npm test -- src/domain/__tests__/steps.test.ts` 确认因模块不存在而失败。
- [ ] 实现纯函数和导航组件。
- [ ] 运行该测试并补充组件导航可访问性断言。

### Task 2: 跨端口 Cookie 持久化

**Files:**
- Create: `src/hooks/useCookieStorage.ts`
- Test: `src/hooks/__tests__/useCookieStorage.test.tsx`
- Modify: `src/App.tsx`, `src/hooks/useMoyuTimer.ts`

**Interfaces:**
- `useCookieStorage<T>(key, initialValue): [T, Dispatch<SetStateAction<T>>]`

- [ ] 先写 Cookie 写入、刷新读取和旧 `localStorage` 迁移失败测试。
- [ ] 运行测试确认 RED。
- [ ] 实现 JSON 编解码、`Path=/`/`SameSite=Lax`/一年有效期和迁移。
- [ ] 把设置与计时器从 `useLocalStorage` 切换到 Cookie hook，保留现有行为。
- [ ] 运行 Cookie、App 和计时器测试确认 GREEN。

### Task 3: 今日累计收益

**Files:**
- Modify: `src/domain/types.ts`, `src/domain/timer.ts`, `src/hooks/useMoyuTimer.ts`, `src/components/MoyuTimer.tsx`
- Test: `src/domain/__tests__/timer.test.ts`, `src/hooks/__tests__/useMoyuTimer.test.tsx`

**Interfaces:**
- `TimerState` includes `dailyDate`, `dailyEarnings`, and optional `finishedEarnings` compatibility fields.
- `useMoyuTimer` returns `todayEarnings` in addition to the existing current-session values.

- [ ] 写结束会话累计、当前会话叠加、跨日清零和重置保留累计的失败测试。
- [ ] 运行计时器测试确认 RED。
- [ ] 实现状态迁移、结束时锁定本次收益和每日累计计算。
- [ ] 在 05 组件增加“今日已赚”读数和状态测试。
- [ ] 运行计时器、组件和全量测试确认 GREEN。

### Task 4: 按端口渲染五个步骤

**Files:**
- Modify: `src/App.tsx`, `src/styles.css`
- Modify: `src/components/BrandHeader.tsx`（仅在需要时调整公共布局）
- Test: `src/components/__tests__/App.test.tsx`

**Interfaces:**
- `App` accepts optional `initialPort` for deterministic tests and otherwise reads `window.location.port`.

- [ ] 先补每个端口只显示对应 section、导航链接和 05 今日已赚的失败断言。
- [ ] 运行 App 测试确认 RED。
- [ ] 只在 App 中做步骤编排，保持领域计算和组件职责不变；加入公共步骤导航。
- [ ] 调整响应式 CSS，使步骤卡片和导航在移动端不溢出。
- [ ] 运行组件测试与全量测试。

### Task 5: 启动五个 Vite 端口并更新文档

**Files:**
- Create: `scripts/dev-all.mjs`
- Modify: `package.json`, `README.md`

- [ ] 写 Node 启动器，启动 5173～5177 五个 Vite 子进程并在退出时回收。
- [ ] 增加 `dev:all` 脚本和五端口访问说明。
- [ ] 运行 `npm run build`、`npm test`。
- [ ] 启动 `npm run dev:all`，逐个请求 5173～5177，确认 HTML 可达；浏览器检查步骤渲染、Cookie 共享和 05 今日收益。
