import { Check, Database, LoaderCircle, TriangleAlert } from 'lucide-react';

interface StatusPillProps {
  source: 'loading' | 'api' | 'fallback';
}

export function StatusPill({ source }: StatusPillProps) {
  if (source === 'loading') {
    return <span className="status-pill status-pill--loading"><LoaderCircle size={14} aria-hidden="true" />读取日历中</span>;
  }
  if (source === 'api') {
    return <span className="status-pill status-pill--success"><Check size={14} aria-hidden="true" />数据来源：实时接口</span>;
  }
  return <span className="status-pill status-pill--fallback"><Database size={14} aria-hidden="true" />数据来源：本地数据</span>;
}

export function ErrorPill({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="inline-warning"><TriangleAlert size={15} aria-hidden="true" />{message}</p>;
}
