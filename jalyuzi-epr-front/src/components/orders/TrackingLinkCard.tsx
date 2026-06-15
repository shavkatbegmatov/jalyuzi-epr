import { useState } from 'react';
import { Link2, Copy, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  trackingCode?: string;
}

/**
 * Staff uchun: buyurtmaning ommaviy kuzatuv havolasi ("Jalyuzimni kuzat").
 * Menejer havolani nusxalab mijozга istalgan vaqtda ulashishi mumkin.
 */
export function TrackingLinkCard({ trackingCode }: Props) {
  const [copied, setCopied] = useState(false);
  if (!trackingCode) return null;

  const url = `${window.location.origin}/t/${trackingCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Havola nusxalandi');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nusxalab bo\'lmadi');
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-base-content/50">
          <Link2 className="h-4 w-4 text-primary" />
          Mijoz kuzatuv havolasi
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="input input-bordered input-sm flex-1 font-mono text-xs"
          />
          <button className="btn btn-primary btn-sm btn-square" onClick={handleCopy} title="Nusxalash">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm btn-square"
            title="Ochish"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <p className="mt-1 text-xs text-base-content/50">
          Mijoz bu havola orqali buyurtma holatini real vaqtda kuzatadi (login shart emas).
        </p>
      </div>
    </div>
  );
}
