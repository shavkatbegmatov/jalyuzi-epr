import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer } from 'lucide-react';
import { ModalPortal } from '../../components/common/Modal';

interface Props {
  order: {
    id: number;
    productionNumber: string;
    productName?: string;
    roomName?: string;
    orderNumber?: string;
  };
  onClose: () => void;
}

/**
 * Chop etiladigan QR job-traveler — sexda mahsulotga yopishtirib qo'yiladigan varaq.
 * QR telefon kamerasi bilan skanerlanadi va /production/scan/{id} sahifasini ochadi.
 */
export function QrTravelerModal({ order, onClose }: Props) {
  const [qr, setQr] = useState<string>('');

  useEffect(() => {
    const url = `${window.location.origin}/production/scan/${order.id}`;
    QRCode.toDataURL(url, { width: 320, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [order.id]);

  return (
    <ModalPortal isOpen onClose={onClose}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #qr-traveler-print, #qr-traveler-print * { visibility: visible !important; }
          #qr-traveler-print { position: fixed; inset: 0; margin: auto; height: max-content; }
          .qr-no-print { display: none !important; }
        }
      `}</style>
      <div className="modal modal-open">
        <div className="modal-box max-w-sm text-center">
          <div className="qr-no-print mb-2 flex items-center justify-between">
            <h3 className="font-bold">QR job-traveler</h3>
            <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div id="qr-traveler-print" className="rounded-xl border-2 border-base-300 p-4">
            <div className="font-mono text-xl font-bold">{order.productionNumber}</div>
            {order.productName && (
              <div className="text-sm">
                {order.productName}
                {order.roomName ? ` · ${order.roomName}` : ''}
              </div>
            )}
            {order.orderNumber && (
              <div className="text-xs text-base-content/50">{order.orderNumber}</div>
            )}
            {qr ? (
              <img src={qr} alt="QR" className="mx-auto my-3 h-56 w-56" />
            ) : (
              <div className="my-3 grid h-56 place-items-center">
                <span className="loading loading-spinner" />
              </div>
            )}
            <div className="text-xs text-base-content/60">
              Telefon kamerasi bilan skanerlang → bosqichni siljiting
            </div>
          </div>

          <button className="qr-no-print btn btn-primary btn-block mt-4" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Chop etish
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
