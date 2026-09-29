# 中性公开标题 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking。

**Goal:** 将页面和浏览器标签中醒目的“带薪摸鱼”替换为中性的“今日进度”。

**Architecture:** `BrandHeader` 继续拥有唯一 H1，只替换展示文案；`index.html` 同步修改静态 `<title>`。不修改项目内部命名、步骤文案或计时逻辑。

**Tech Stack:** React、TypeScript、Vite、Vitest、Testing Library。

## Global Constraints

- 页面 H1 和浏览器标签统一显示“今日进度”。
- 保留现有标题层级、样式和响应式布局。
- 不修改其他功能文案。
- 当前目录不是 Git 仓库，不执行提交步骤。

---

### Task 1: 替换公开标题

**Files:**
- Modify: `src/components/BrandHeader.tsx`
- Modify: `index.html`
- Test: `src/components/__tests__/App.test.tsx`

**Interfaces:**
- `BrandHeader` renders one level-one heading named `今日进度`.
- `index.html` provides `<title>今日进度</title>` before React loads.

- [ ] **Step 1: 写失败测试**

  将 App 测试中的标题断言改为：

  ```tsx
  expect(screen.getByRole('heading', { name: '今日进度' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '带薪摸鱼' })).not.toBeInTheDocument();
  ```

- [ ] **Step 2: 运行测试确认 RED**

  Run: `npm test -- src/components/__tests__/App.test.tsx`

  Expected: FAIL because the existing H1 is still `带薪摸鱼`.

- [ ] **Step 3: 实现最小文案变更**

  将 `BrandHeader.tsx` 中 `<h1>带薪摸鱼</h1>` 改为 `<h1>今日进度</h1>`；将 `index.html` 中 `<title>带薪摸鱼</title>` 改为 `<title>今日进度</title>`。

- [ ] **Step 4: 运行完整验证**

  Run: `npm test && npm run build`

  Expected: 27 tests pass and Vite production build succeeds.

- [ ] **Step 5: 浏览器验收**

  打开 `http://localhost:5173/01`，确认页面 H1 和标签页标题均为“今日进度”，移动端无横向溢出，控制台无 error/warning。

**Execution status:** Complete. 27 个测试通过，生产构建与桌面/移动端浏览器验收完成。
