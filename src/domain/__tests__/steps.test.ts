import { describe, expect, it } from 'vitest';
import { getStepFromPath, getStepPath } from '../steps';

describe('steps', () => {
  it('maps the five same-origin paths to the five product steps', () => {
    expect(getStepFromPath('/01')).toBe(1);
    expect(getStepFromPath('/02')).toBe(2);
    expect(getStepFromPath('/03')).toBe(3);
    expect(getStepFromPath('/04')).toBe(4);
    expect(getStepFromPath('/05/')).toBe(5);
  });

  it('falls back to the first step for the root or an unknown path', () => {
    expect(getStepFromPath('/')).toBe(1);
    expect(getStepFromPath('/other')).toBe(1);
    expect(getStepFromPath('')).toBe(1);
  });

  it('builds a same-origin path without a host or port', () => {
    expect(getStepPath(5)).toBe('/05');
    expect(getStepPath(2)).toBe('/02');
  });
});
