import { Clock3, WalletCards } from 'lucide-react';

interface PaySettingsProps {
  salary: number;
  hoursPerDay: number;
  errors: { salary?: string; hoursPerDay?: string };
  onSalaryChange: (salary: number) => void;
  onHoursChange: (hours: number) => void;
}

export function PaySettings({ salary, hoursPerDay, errors, onSalaryChange, onHoursChange }: PaySettingsProps) {
  return (
    <section className="section-block" aria-labelledby="pay-title">
      <div className="section-heading">
        <div><span className="section-kicker">02 · 薪资设置</span><h2 id="pay-title">把你的工作参数放进来</h2></div>
        <WalletCards size={22} aria-hidden="true" />
      </div>
      <div className="form-grid">
        <label className="field">
          <span>税前月薪</span>
          <div className="input-wrap"><span>¥</span><input aria-label="税前月薪" type="number" min="0" step="100" value={salary || ''} onChange={(event) => onSalaryChange(Number(event.target.value))} /></div>
          {errors.salary && <small className="field-error">{errors.salary}</small>}
        </label>
        <label className="field">
          <span>每天上班小时数</span>
          <div className="input-wrap"><Clock3 size={16} aria-hidden="true" /><input aria-label="每天上班小时数" type="number" min="0" step="0.5" value={hoursPerDay || ''} onChange={(event) => onHoursChange(Number(event.target.value))} /><em>小时</em></div>
          {errors.hoursPerDay && <small className="field-error">{errors.hoursPerDay}</small>}
        </label>
      </div>
    </section>
  );
}
