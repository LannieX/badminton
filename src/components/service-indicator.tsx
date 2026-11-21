import { CircleDot } from 'lucide-react';
import type { serviceState } from '../lib/service';
export function ServiceIndicator({
  service,
  side,
}: {
  service: ReturnType<typeof serviceState>;
  side: number;
}) {
  const serving = service.side === side;
  return (
    <span className={`service-indicator ${serving ? 'is-serving' : ''}`}>
      {serving && <CircleDot size={15} aria-hidden="true" />}
      <span>
        {serving
          ? `${service.serverName} เสิร์ฟ · ช่อง${service.court}`
          : `${service.receiverName} รับ`}
      </span>
    </span>
  );
}
