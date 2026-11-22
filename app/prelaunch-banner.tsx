import { ShieldAlert } from 'lucide-react';

export function PrelaunchBanner() {
  return (
    <aside className="ds-prelaunch-bar" role="status">
      <div className="ds-container ds-prelaunch-inner">
        <ShieldAlert size={16} aria-hidden="true" />
        <span>
          <strong>Pre-launch:</strong> Doorstep is under legal and operational review in Kenya. No online payments are
          collected. Professional document uploads remain disabled; never upload national IDs or sensitive records.
        </span>
      </div>
    </aside>
  );
}
