# 带薪摸鱼前端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 React + Vite 单页工具，按用户的单休/双休/大小周、节假日调休、税前月薪和每日工时计算实际工作日及时薪，并提供可持久化的带薪摸鱼计时器。

**Architecture:** 浏览器端直接请求无需 Key 的年度节假日接口，使用 adapter 转为统一日期记录；请求失败时使用本地回退数据。纯函数负责工作日、薪资和计时器计算，React 组件只负责状态编排和展示，所有用户设置、日期修正和计时器状态保存在 `localStorage`。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Testing Library、`lucide-react`、CSS（无 UI 框架）。

**Execution status:** Complete. 当前环境没有可用的内置 `image_gen` 工具，因此视觉资产使用项目内 SVG 贴纸插画完成。

## Global Constraints

- 中国大陆规则：单休默认周日休息、双休默认周六日休息，大小周由用户选择当前周类型后按自然周交替。
- 税前时薪公式：`税前月薪 ÷ 实际工作日 ÷ 每天上班小时数`。
- 2026 年 9 月双休验收值为 22 个实际工作日：9 月 20 日调休上班，9 月 25 日中秋放假，9 月 26/27 日周末休息。
- 计时器默认按分钟结算，也可切换按秒或按小时；按所选单位的完整数量计算收益，页面显示所选单位。
- 非工作日不可开始计时，提示“今天不用上班，安心休息”。
- API 请求设置超时并允许回退；不得在代码中写入密钥或依赖服务端数据库。
- UI 使用暖米白、珊瑚橙、薄荷绿、天空蓝和柠檬黄，圆角不超过 8px，移动端触控目标不小于 44px。
- 当前工作目录没有 Git 元数据，计划中的提交步骤不执行，以文件和测试结果作为变更记录。

---

### Task 1: 建立 React、TypeScript 和测试骨架

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/test/setup.ts`
- Create: `src/vite-env.d.ts`

**Interfaces:**
- Produces npm scripts `dev`, `build`, `test`, `test:watch` and a jsdom-enabled Vitest environment for later tasks.

- [ ] **Step 1: 写入最小项目配置**

  `package.json` 使用以下脚本和依赖范围：

  ```json
  {
    "name": "paid-fishing",
    "private": true,
    "version": "0.1.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc -b && vite build",
      "test": "vitest run",
      "test:watch": "vitest"
    },
    "dependencies": {
      "lucide-react": "latest",
      "react": "latest",
      "react-dom": "latest"
    },
    "devDependencies": {
      "@testing-library/jest-dom": "latest",
      "@testing-library/react": "latest",
      "@testing-library/user-event": "latest",
      "@types/react": "latest",
      "@types/react-dom": "latest",
      "@vitejs/plugin-react": "latest",
      "jsdom": "latest",
      "typescript": "latest",
      "vite": "latest",
      "vitest": "latest"
    }
  }
  ```

- [ ] **Step 2: 安装依赖并建立 Vite 配置**

  Run:

  ```bash
  npm install
  ```

  Configure `vite.config.ts` with the React plugin and `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', globals: true }`. Add `src/test/setup.ts` with `import '@testing-library/jest-dom/vitest';`.

- [ ] **Step 3: 添加最小入口并验证骨架**

  `src/main.tsx` renders `<div id="root" />` through `createRoot`. `index.html` sets `lang="zh-CN"`, title `带薪摸鱼`, and the root element.

  Run:

  ```bash
  npm run build
  npm test -- --passWithNoTests
  ```

  Expected: build succeeds and Vitest exits successfully with no test files.

### Task 2: 实现日期模型、工作节奏和月度工作日计算

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/dateUtils.ts`
- Create: `src/domain/workdayCalculator.ts`
- Create: `src/domain/salaryCalculator.ts`
- Create: `src/domain/__tests__/workdayCalculator.test.ts`
- Create: `src/domain/__tests__/salaryCalculator.test.ts`

**Interfaces:**
- Produces `CalendarDay`, `CalendarOverlay`, `WorkPattern`, `WeekType`, `SettlementUnit` and `buildCalendarDays(month, settings, overlays, overrides)` for UI/API tasks.
- Produces `countWorkdays(days)`, `calculateHourlyRate(salary, workdays, hoursPerDay)` and `validateSalaryInputs(input)`.

- [ ] **Step 1: 先写日期计算失败测试**

  在 `workdayCalculator.test.ts` 写以下行为测试：

  ```ts
  it('counts 22 actual workdays for September 2026 double-rest schedule', () => {
    const days = buildCalendarDays(
      '2026-09',
      { pattern: 'double', alternateWeekType: 'single' },
      [
        { date: '2026-09-20', status: 'makeup', label: '调休上班', source: 'api' },
        { date: '2026-09-25', status: 'holiday', label: '中秋节', source: 'api' },
      ],
      {},
    );

    expect(countWorkdays(days)).toBe(22);
    expect(days.find((day) => day.date === '2026-09-20')?.status).toBe('makeup');
    expect(days.find((day) => day.date === '2026-09-25')?.status).toBe('holiday');
    expect(days.find((day) => day.date === '2026-09-27')?.status).toBe('rest');
  });

  it('uses Sunday as the only rest day for single-rest pattern', () => {
    const days = buildCalendarDays('2026-09', { pattern: 'single', alternateWeekType: 'single' }, [], {});
    expect(days.find((day) => day.date === '2026-09-05')?.status).toBe('work');
    expect(days.find((day) => day.date === '2026-09-06')?.status).toBe('rest');
  });

  it('alternates single and double weeks from the selected first week type', () => {
    const days = buildCalendarDays('2026-09', { pattern: 'alternate', alternateWeekType: 'double' }, [], {});
    expect(days.find((day) => day.date === '2026-09-05')?.status).toBe('rest');
    expect(days.find((day) => day.date === '2026-09-12')?.status).toBe('work');
  });

  it('gives user overrides priority over API and pattern', () => {
    const days = buildCalendarDays(
      '2026-09',
      { pattern: 'double', alternateWeekType: 'single' },
      [{ date: '2026-09-20', status: 'makeup', label: '调休上班', source: 'api' }],
      { '2026-09-20': 'rest' },
    );
    expect(days.find((day) => day.date === '2026-09-20')?.status).toBe('rest');
    expect(days.find((day) => day.date === '2026-09-20')?.source).toBe('user');
  });
  ```

- [ ] **Step 2: 运行日期测试确认 RED**

  Run:

  ```bash
  npm test -- src/domain/__tests__/workdayCalculator.test.ts
  ```

  Expected: FAIL because the domain types and functions do not exist yet.

- [ ] **Step 3: 实现最小日期模型和计算器**

  `buildCalendarDays` must:

  - Generate every UTC date in `YYYY-MM` to avoid local timezone drift.
  - Treat Monday-Sunday as a natural week; single-rest weeks mark Sunday as `rest`, double-rest weeks mark Saturday and Sunday as `rest`.
  - For `alternate`, use the week containing the first day of the selected month as the anchor and alternate the selected `alternateWeekType` on following weeks.
  - Apply overlays after the base pattern and overrides last; `holiday` marks a day off and `makeup` marks a day as work.
  - Return `source` as `pattern`, overlay source, or `user`.

  `countWorkdays` counts only final `work` and `makeup` days, so the September fixture is 22.

- [ ] **Step 4: 运行日期测试确认 GREEN**

  Run the same command. Expected: all four tests pass.

- [ ] **Step 5: 先写薪资失败测试，再实现**

  Add and run this test before implementing `salaryCalculator.ts`:

  ```ts
  it('calculates hourly rate from salary, workdays, and daily hours', () => {
    expect(calculateHourlyRate(18000, 22, 8)).toBeCloseTo(102.2727, 4);
  });

  it('rejects non-positive salary, workdays, or hours', () => {
    expect(validateSalaryInputs({ salary: 0, workdays: 22, hoursPerDay: 8 })).toEqual({ salary: '请输入大于 0 的月薪' });
    expect(validateSalaryInputs({ salary: 18000, workdays: 0, hoursPerDay: 8 })).toEqual({ workdays: '本月没有可计算的工作日' });
    expect(validateSalaryInputs({ salary: 18000, workdays: 22, hoursPerDay: 0 })).toEqual({ hoursPerDay: '请输入大于 0 的上班小时数' });
  });
  ```

  Run `npm test -- src/domain/__tests__/salaryCalculator.test.ts` and confirm RED; implement the two pure functions; run again and confirm GREEN.

### Task 3: 实现节假日 API、回退数据和本地修正合并

**Files:**
- Create: `src/services/calendarApi.ts`
- Create: `src/services/fallbackCalendar.ts`
- Create: `src/services/__tests__/calendarApi.test.ts`

**Interfaces:**
- Consumes `CalendarOverlay` from `src/domain/types.ts`.
- Produces `fetchCalendarOverlays(year, fetcher, timeoutMs)` returning `{ overlays: CalendarOverlay[]; source: 'api' | 'fallback'; error?: string }`.

- [ ] **Step 1: 写 API adapter 的失败测试**

  Use a real `Response` fixture and a deterministic fake fetcher:

  ```ts
  it('normalizes holiday and makeup dates from provider payload', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      holiday: {
        '中秋节': { name: '中秋节', list: ['2026-09-25', '2026-09-26', '2026-09-27'], rest: 1 },
        '调休': { name: '调休上班', list: ['2026-09-20'], rest: 0 },
      },
    }), { status: 200 }));

    const result = await fetchCalendarOverlays(2026, fetcher, 100);
    expect(result.source).toBe('api');
    expect(result.overlays).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: '2026-09-25', status: 'holiday', label: '中秋节' }),
      expect.objectContaining({ date: '2026-09-20', status: 'makeup', label: '调休上班' }),
    ]));
  });

  it('falls back when the request times out or returns invalid data', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('timeout'));
    const result = await fetchCalendarOverlays(2026, fetcher, 1);
    expect(result.source).toBe('fallback');
    expect(result.overlays).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: '2026-09-20', status: 'makeup' }),
      expect.objectContaining({ date: '2026-09-25', status: 'holiday' }),
    ]));
  });
  ```

- [ ] **Step 2: 运行测试确认 RED**

  Run `npm test -- src/services/__tests__/calendarApi.test.ts`; expect failures for missing adapter and fallback modules.

- [ ] **Step 3: 实现超时、解析和回退**

  Request `https://timor.tech/api/holiday/year/${year}` through an `AbortController`; use a 6000ms default timeout, require a successful HTTP response, and normalize each provider holiday list into `CalendarOverlay` records. Any network, JSON, shape, or timeout error returns the 2026 September fallback records plus `source: 'fallback'` and a user-safe error string. Keep provider field names inside this file only.

- [ ] **Step 4: 运行 API 测试确认 GREEN**

  Run the same test command; expect both tests to pass. Add one test for non-2xx response before moving on.

### Task 4: 实现可持久化的计时器和收益换算

**Files:**
- Create: `src/domain/timer.ts`
- Create: `src/domain/__tests__/timer.test.ts`
- Create: `src/hooks/useLocalStorage.ts`
- Create: `src/hooks/useMoyuTimer.ts`

**Interfaces:**
- Produces pure functions `createTimerState`, `startTimer`, `pauseTimer`, `resumeTimer`, `finishTimer`, `resetTimer`, `getElapsedMs`, `getSettledUnits`, `getTimerEarnings`.
- Produces React hook `useMoyuTimer({ hourlyRate, settlementUnit, canStart })` exposing `{ state, elapsedMs, settledUnits, earnings, start, pause, resume, finish, reset }`.

- [ ] **Step 1: 写计时器失败测试**

  ```ts
  it('settles one minute as hourlyRate divided by 60', () => {
    expect(getSettledUnits(60_000, 'minute')).toBe(1);
    expect(getTimerEarnings(60_000, 'minute', 120)).toBe(2);
  });

  it('supports second, minute, and hour units without changing accumulated time', () => {
    expect(getSettledUnits(3_600_000, 'second')).toBe(3600);
    expect(getSettledUnits(3_600_000, 'minute')).toBe(60);
    expect(getSettledUnits(3_600_000, 'hour')).toBe(1);
  });

  it('pauses and resumes from the accumulated milliseconds', () => {
    const running = startTimer(createTimerState(), 1_000);
    const paused = pauseTimer(running, 61_000);
    expect(paused.accumulatedMs).toBe(60_000);
    const resumed = resumeTimer(paused, 120_000);
    expect(getElapsedMs(resumed, 180_000)).toBe(120_000);
  });

  it('does not start when the current date is not a workday', () => {
    expect(() => startTimer(createTimerState(), 1_000, false)).toThrow('今天不用上班，安心休息');
  });
  ```

- [ ] **Step 2: 运行测试确认 RED**

  Run `npm test -- src/domain/__tests__/timer.test.ts`; expect missing-function failures.

- [ ] **Step 3: 实现纯计时器状态机**

  Keep `accumulatedMs` and `startedAt`; when pausing or finishing, add `now - startedAt` and clear `startedAt`. `getElapsedMs` adds the live delta only while running. `getSettledUnits` floors by 1000, 60000, or 3600000 based on `SettlementUnit`; `getTimerEarnings` converts settled units to hourly earnings. `startTimer` accepts `canStart` and throws the exact Chinese rest-day message when false.

- [ ] **Step 4: 运行测试确认 GREEN**

  Run the same command; expect all timer tests to pass.

- [ ] **Step 5: 添加 localStorage hook 并写恢复测试**

  Implement `useLocalStorage<T>(key, initialValue)` with guarded JSON parse/stringify and a `storage` event listener. In `useMoyuTimer`, persist every state transition and on mount restore a running state from timestamps. Add a Testing Library hook/component test that writes a running state, mounts the hook, advances fake time, and verifies `elapsedMs` increases without a page reload.

### Task 5: 搭建页面组件和状态编排

**Files:**
- Create: `src/App.tsx`
- Create: `src/components/BrandHeader.tsx`
- Create: `src/components/SchedulePicker.tsx`
- Create: `src/components/PaySettings.tsx`
- Create: `src/components/MonthlySummary.tsx`
- Create: `src/components/MonthCalendar.tsx`
- Create: `src/components/MoyuTimer.tsx`
- Create: `src/components/StatusPill.tsx`
- Create: `src/hooks/useCalendar.ts`
- Create: `src/components/__tests__/App.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- `App` owns `Settings`, fetched overlays, merged `CalendarDay[]`, and selected calendar day.
- Components receive typed props and do not call the external API directly.

- [ ] **Step 1: 先写页面失败测试**

  In `App.test.tsx`, mock `fetchCalendarOverlays` and assert these behaviors:

  ```tsx
  it('renders schedule, salary summary, calendar, and timer sections', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: '带薪摸鱼' })).toBeInTheDocument();
    expect(screen.getByText('本月工作日')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '开始摸鱼' })).toBeInTheDocument();
    expect(await screen.findByText('数据来源：本地数据')).toBeInTheDocument();
  });

  it('disables the timer on a rest day and shows the rest message', async () => {
    render(<App initialToday="2026-09-27" />);
    expect(screen.getByRole('button', { name: '开始摸鱼' })).toBeDisabled();
    expect(screen.getByText('今天不用上班，安心休息')).toBeInTheDocument();
  });

  it('switches settlement units without resetting elapsed time', async () => {
    render(<App initialToday="2026-09-21" />);
    await userEvent.click(screen.getByRole('button', { name: '开始摸鱼' }));
    await userEvent.click(screen.getByRole('radio', { name: '按小时' }));
    expect(screen.getByText('按小时')).toBeInTheDocument();
    expect(screen.queryByText('0 分钟')).not.toBeInTheDocument();
  });
  ```

- [ ] **Step 2: 运行组件测试确认 RED**

  Run `npm test -- src/components/__tests__/App.test.tsx`; expect missing `App` and component failures.

- [ ] **Step 3: 实现状态编排和组件**

  `App` should:

  - Initialize month to `2026-09` only when no persisted month exists; otherwise restore saved settings.
  - Load year overlays through `useCalendar`, merge with pattern and user overrides, and expose API/fallback status.
  - Recalculate summary when schedule, month, salary, hours, overlays, or overrides change.
  - Block `start` when today's merged status is `rest` or `holiday`; pass `canStart` to `useMoyuTimer`.
  - Render the six single-column sections with concise Chinese labels and no explanatory marketing blocks.

  `SchedulePicker` uses a segmented control for three patterns and a second control for alternate week type. `PaySettings` validates number inputs and month. `MonthCalendar` renders weekday headers, status classes, API/user source text, and an edit control that cycles a date override through work/rest/holiday/makeup/clear. `MoyuTimer` renders a second/minute/hour segmented unit control, the settled whole number, earnings to two decimals, and state-specific icon buttons using `lucide-react`.

- [ ] **Step 4: 运行组件测试确认 GREEN**

  Run the same test command. Fix component behavior or accessibility queries until all tests pass.

### Task 6: 完成可爱视觉、插画资产和响应式样式

**Files:**
- Create: `public/moyu-mascot.svg`
- Create: `src/styles.css`
- Modify: `src/main.tsx`
- Modify: `src/components/BrandHeader.tsx`

**Interfaces:**
- `BrandHeader` consumes the local SVG asset and current API status; all other components consume CSS tokens/classes only.

- [x] **Step 1: 生成本地插画资产**

  The built-in `image_gen` tool was unavailable in this environment, so the final asset is a local `public/moyu-mascot.svg` sticker illustration: a cute office cat beside a laptop, warm coral/mint/sky accents, no text, no gradient, and no remote URL.

- [ ] **Step 2: 写样式失败检查清单**

  Before adding CSS, verify the page currently renders unstyled but functionally. The visual smoke check must confirm there is no production CSS yet and the mascot file path exists.

- [ ] **Step 3: 实现设计 tokens 和布局**

  Add CSS variables for `--cream`, `--ink`, `--coral`, `--mint`, `--sky`, `--lemon`, and `--line`; style the single-column flow, compact section headings, segmented controls, summary numbers, seven-column calendar, status legend, timer panel, focus rings, disabled state, and responsive breakpoint at 760px. Keep all corner radii at 8px or less and avoid decorative gradients/orbs.

- [ ] **Step 4: 运行构建和组件测试**

  Run:

  ```bash
  npm test
  npm run build
  ```

  Expected: all unit/component tests pass and the production build completes without TypeScript errors.

### Task 7: 集成验证和交付检查

**Files:**
- Create: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Documents local run commands, API fallback behavior, and the default 2026-09 demo state for the user.

- [ ] **Step 1: 写 README 的可复现验证步骤**

  Document `npm install`, `npm run dev`, `npm test`, `npm run build`, the public API dependency, local fallback, and the three timer settlement units. Do not include credentials or claim API availability beyond the fallback guarantee. Add `.superpowers/` and `node_modules/` to `.gitignore`.

- [ ] **Step 2: 运行完整自动化验证**

  Run:

  ```bash
  npm test
  npm run build
  ```

  Expected: no failed tests, no TypeScript errors, no unhandled console errors from the test suite.

- [ ] **Step 3: 启动开发服务器做浏览器冒烟检查**

  Run `npm run dev -- --host 0.0.0.0`, open the printed URL, and verify:

  - default 2026-09 double-rest example shows 22 actual workdays;
  - 9/20 is marked makeup, 9/25 holiday, 9/26-27 rest;
  - invalid salary/hour inputs show field errors;
  - rest-day start is disabled;
  - workday start, pause, resume, finish, reset work;
  - switching second/minute/hour keeps elapsed time and changes displayed units/earnings;
  - reload restores running timer state;
  - API fallback indicator appears when the request is blocked or mocked to fail;
  - mobile viewport has no horizontal overflow and calendar cells remain tappable.

- [ ] **Step 4: Record final verification**

  Capture the exact commands and outcomes in the final response, state that no Git commit was possible because the directory has no `.git`, and call out any external API behavior that could not be verified offline.

## Self-Review Checklist

- Spec coverage: schedule patterns, holiday overlays, 22-day September example, salary/hour validation, three settlement units, timer persistence, fallback behavior, cute local asset, responsive UI, and keyboard/status accessibility are each covered by Tasks 2-7.
- Placeholder scan: all steps contain concrete paths, commands, expected results, and implementation details.
- Type consistency: `SettlementUnit`, `CalendarDay`, `CalendarOverlay`, `TimerState`, and the named pure functions are defined in Task 2/4 before consumers in Tasks 3/5.
- Scope: no authentication, payroll tax, backend database, or historical report work is included.
