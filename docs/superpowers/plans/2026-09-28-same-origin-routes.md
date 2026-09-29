# 同域五路径流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将五个步骤从五个 localhost 端口迁移到同一站点的 `/01`～`/05`，并准备静态公网部署。

**Architecture:** `src/domain/steps.ts` 只负责 pathname 与步骤之间的纯函数映射，导航组件只生成站内路径。设置和计时器统一使用 `localStorage`；该 Hook 在本地值缺失时读取同名旧 Cookie，保存后清理 Cookie。

**Tech Stack:** React、TypeScript、Vite、Vitest、Testing Library、Vercel 静态托管配置。

## Global Constraints

- 正式步骤地址固定为 `/01`、`/02`、`/03`、`/04`、`/05`。
- `/` 和未知路径显示 01，不得依赖开发端口决定步骤。
- 所有步骤共享现有设置、日期修正、计时器和今日累计收益。
- 不改变现有视觉、节假日、薪资和计时规则。
- 删除多端口启动方式，本地入口为 `http://localhost:5173/01`。
- `npm test`、`npm run build` 和五个路径的浏览器验证必须通过。

---

### Task 1: 路径步骤映射与导航

**Files:**
- Modify: `src/domain/steps.ts`
- Modify: `src/components/StepNavigation.tsx`
- Modify: `src/App.tsx`
- Test: `src/domain/__tests__/steps.test.ts`
- Test: `src/components/__tests__/App.test.tsx`

**Interfaces:**
- Produces `getStepFromPath(pathname?: string): AppStep`.
- Produces `getStepPath(step: AppStep): '/01' | '/02' | '/03' | '/04' | '/05'`.

- [ ] **Step 1: 写路径映射失败测试**

  断言 `getStepFromPath('/01') === 1`、`getStepFromPath('/05/') === 5`、未知路径返回 1，并断言 `getStepPath(3) === '/03'`。

- [ ] **Step 2: 运行 RED**

  Run: `npm test -- src/domain/__tests__/steps.test.ts src/components/__tests__/App.test.tsx`

  Expected: 旧实现仍导出端口函数，路径断言失败。

- [ ] **Step 3: 实现最小路径映射**

  删除 `STEP_PORTS`、`getStepFromPort`、`getStepPort`、`getStepUrl`；App 读取 `window.location.pathname`，测试通过 `initialPath` 注入。导航的 `href` 直接使用 `getStepPath(step)`，移除“当前端口”文案。

- [ ] **Step 4: 运行 GREEN**

  Run: `npm test -- src/domain/__tests__/steps.test.ts src/components/__tests__/App.test.tsx`

  Expected: 路径映射和每页唯一步骤测试全部通过。

### Task 2: localStorage 与旧 Cookie 迁移

**Files:**
- Modify: `src/hooks/useLocalStorage.ts`
- Modify: `src/hooks/useMoyuTimer.ts`
- Modify: `src/App.tsx`
- Delete: `src/hooks/useCookieStorage.ts`
- Replace test: `src/hooks/__tests__/useCookieStorage.test.tsx` with `src/hooks/__tests__/useLocalStorage.test.tsx`

**Interfaces:**
- `useLocalStorage<T>(key, initialValue)` first reads a valid same-name Cookie, then localStorage, then default value; its first effect persists the selected value and expires the Cookie.

- [ ] **Step 1: 写迁移失败测试**

  覆盖普通 localStorage 恢复、旧 Cookie 优先迁移、迁移后 Cookie 被删除三种行为。

- [ ] **Step 2: 运行 RED**

  Run: `npm test -- src/hooks/__tests__/useLocalStorage.test.tsx`

  Expected: 现有 Hook 不读取或删除 Cookie。

- [ ] **Step 3: 实现迁移并切换消费者**

  App 设置与 `useMoyuTimer` 改用 `useLocalStorage`，保留 storage 事件同步；Hook 用 `decodeURIComponent` 和 `JSON.parse` 安全读取旧 Cookie，持久化后以 `Max-Age=0; Path=/` 清理。

- [ ] **Step 4: 运行 GREEN**

  Run: `npm test -- src/hooks/__tests__/useLocalStorage.test.tsx src/hooks/__tests__/useMoyuTimer.test.tsx src/components/__tests__/App.test.tsx`

  Expected: 迁移、计时器恢复和页面行为全部通过。

### Task 3: 单端口运行与公网刷新回退

**Files:**
- Delete: `scripts/dev-all.mjs`
- Modify: `package.json`
- Modify: `README.md`
- Create: `vercel.json`

**Interfaces:**
- `npm run dev` serves all five paths from one Vite process.
- Vercel rewrite `{ "source": "/(.*)", "destination": "/index.html" }` supports direct path refresh.

- [ ] **Step 1: 移除 `dev:all` 并增加部署配置**

  `package.json` 仅保留 `dev: vite`；`vercel.json` 写入 SPA catch-all rewrite；README 将地址表改为 `http://localhost:5173/01`～`/05`。

- [ ] **Step 2: 运行完整验证**

  Run: `npm test && npm run build`

  Expected: 0 failures，Vite 生产构建成功。

- [ ] **Step 3: 浏览器验收**

  启动 `npm run dev -- --host 0.0.0.0 --port 5173`，逐一访问 `/01`～`/05`，确认页面步骤、导航、刷新和移动端无横向溢出，控制台无 error/warning。

**Execution status:** Complete. 当前目录不是 Git 仓库，因此未执行提交步骤；测试、构建和浏览器验收均已完成。
