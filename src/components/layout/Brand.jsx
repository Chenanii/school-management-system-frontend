import { BookOpen } from 'lucide-react';

export default function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark"><BookOpen size={20} strokeWidth={2.3} /></div>
      <div>
        <div className="text-[17px] font-bold tracking-[-0.04em] text-ink">schoolhouse</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">School management</div>
      </div>
    </div>
  );
}
