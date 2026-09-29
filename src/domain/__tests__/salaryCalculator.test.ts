import { describe, expect, it } from 'vitest';
import { calculateHourlyRate, validateSalaryInputs } from '../salaryCalculator';

describe('salaryCalculator', () => {
  it('calculates hourly rate from salary, workdays, and daily hours', () => {
    expect(calculateHourlyRate(18000, 22, 8)).toBeCloseTo(102.2727, 4);
  });

  it('rejects non-positive salary, workdays, or hours', () => {
    expect(validateSalaryInputs({ salary: 0, workdays: 22, hoursPerDay: 8 })).toEqual({
      salary: '请输入大于 0 的月薪',
    });
    expect(validateSalaryInputs({ salary: 18000, workdays: 0, hoursPerDay: 8 })).toEqual({
      workdays: '本月没有可计算的工作日',
    });
    expect(validateSalaryInputs({ salary: 18000, workdays: 22, hoursPerDay: 0 })).toEqual({
      hoursPerDay: '请输入大于 0 的上班小时数',
    });
  });
});
