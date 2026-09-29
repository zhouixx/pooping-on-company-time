export type AppStep = 1 | 2 | 3 | 4 | 5;

export const STEP_LABELS: Record<AppStep, string> = {
  1: '01 · 工作节奏',
  2: '02 · 薪资设置',
  3: '03 · 本月结果',
  4: '04 · 月历',
  5: '05 · 摸鱼计时器',
};

const STEP_PATHS: Record<AppStep, `/${string}`> = {
  1: '/01',
  2: '/02',
  3: '/03',
  4: '/04',
  5: '/05',
};

export function getStepFromPath(pathname?: string): AppStep {
  const normalizedPath = `/${(pathname ?? '').split('/').filter(Boolean)[0] ?? ''}`;
  const entry = Object.entries(STEP_PATHS).find(([, path]) => path === normalizedPath);
  return entry ? (Number(entry[0]) as AppStep) : 1;
}

export function getStepPath(step: AppStep): `/${string}` {
  return STEP_PATHS[step];
}
