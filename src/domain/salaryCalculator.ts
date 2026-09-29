import type { SalaryErrors, SalaryInput } from './types';

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function validateSalaryInputs(input: SalaryInput): SalaryErrors {
  const errors: SalaryErrors = {};

  if (!isPositiveFinite(input.salary)) {
    errors.salary = '请输入大于 0 的月薪';
  }
  if (!isPositiveFinite(input.workdays)) {
    errors.workdays = '本月没有可计算的工作日';
  }
  if (!isPositiveFinite(input.hoursPerDay)) {
    errors.hoursPerDay = '请输入大于 0 的上班小时数';
  }

  return errors;
}

export function calculateHourlyRate(salary: number, workdays: number, hoursPerDay: number): number {
  const errors = validateSalaryInputs({ salary, workdays, hoursPerDay });
  if (Object.keys(errors).length > 0) {
    return 0;
  }
  return salary / workdays / hoursPerDay;
}
