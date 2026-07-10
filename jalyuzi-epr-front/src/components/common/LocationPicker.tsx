import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, LocateFixed, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalPortal } from './Modal';
import {
  DEFAULT_MAP_CENTER,
  formatCoords,
  getCurrentPosition,
  type GeoPoint,
} from '../../utils/locationUtils';

// OpenStreetMap tile qatlami (API kalitsiz, bepul)
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Preview'dagi marker — SVG pin (leaflet'ning default rasm-ikonlari bundler'da buziladi)
const PIN_SVG = `
<svg width="34" height="34" viewBox="0 0 24 24" fill="#4f46e5" stroke="#ffffff" stroke-width="1.2" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
  <circle cx="12" cy="9" r="2.5" fill="#ffffff" stroke="none"/>
</svg>`;

const pinIcon = L.divIcon({
  className: 'jalyuzi-map-pin',
  html: PIN_SVG,
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

/**
 * Xaritani xavfsiz yo'q qilish. Drag o'rtasida (barmoq xaritada turganda)
 * komponent unmount bo'lsa, leaflet'ning finishDrag'i ichki xatoga tushadi —
 * bu butun sahifani yiqitmasligi kerak.
 */
function safeRemoveMap(map: L.Map | null) {
  try {
    map?.remove();
  } catch {
    // leaflet ichki cleanup xatosi — e'tiborsiz qoldiramiz
  }
}

// =============================================================================
// LocationPreview — kichik, interaktiv bo'lmagan xarita (tanlangan joyni ko'rsatadi)
// =============================================================================
interface LocationPreviewProps {
  lat: number;
  lng: number;
  className?: string;
  onClick?: () => void;
}

export function LocationPreview({ lat, lng, className, onClick }: LocationPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        attributionControl: false,
      });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
      markerRef.current = L.marker([lat, lng], { icon: pinIcon, interactive: false }).addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView([lat, lng], 16);
      markerRef.current?.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  // Unmount'da xaritani tozalash
  useEffect(() => {
    return () => {
      safeRemoveMap(mapRef.current);
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-base-300 ${
        onClick ? 'cursor-pointer' : ''
      } ${className || 'h-36 w-full'}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div ref={containerRef} className="h-full w-full" />
      {/* onClick ustuvorligi uchun shaffof qatlam (xarita hodisalarni yutmasin) */}
      {onClick && <div className="absolute inset-0 z-[500]" />}
    </div>
  );
}

// =============================================================================
// LocationPickerModal — Telegram uslubidagi joy tanlagich:
// xarita suriladi, pin markazda turadi; default — joriy joylashuv.
// =============================================================================
interface LocationPickerModalProps {
  isOpen: boolean;
  /** Mavjud lokatsiya (o'zgartirish rejimi). Bo'lmasa joriy joylashuv olinadi. */
  initial?: GeoPoint | null;
  onClose: () => void;
  onSelect: (point: GeoPoint) => void;
  /** Tasdiqlash tugmasi loading holati (saqlash API kutilmoqda) */
  saving?: boolean;
}

export function LocationPickerModal({
  isOpen,
  initial,
  onClose,
  onSelect,
  saving,
}: LocationPickerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [center, setCenter] = useState<GeoPoint>(initial || DEFAULT_MAP_CENTER);
  const [moving, setMoving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Xaritani init qilish (modal ochilganda DOM tayyor bo'ladi)
  useEffect(() => {
    if (!isOpen || !containerRef.current || mapRef.current) return;

    const start = initial || DEFAULT_MAP_CENTER;
    const map = L.map(containerRef.current, {
      center: [start.lat, start.lng],
      zoom: initial ? 17 : 13,
      zoomControl: false,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    map.on('movestart', () => setMoving(true));
    map.on('moveend', () => {
      setMoving(false);
      const c = map.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });
    });

    mapRef.current = map;
    setCenter(start);

    // Modal animatsiyasidan keyin o'lchamni tuzatish
    setTimeout(() => map.invalidateSize(), 150);

    // Telegram'dagidek: mavjud lokatsiya bo'lmasa, joriy joylashuvga o'tish
    if (!initial) {
      setLocating(true);
      getCurrentPosition().then((pos) => {
        setLocating(false);
        if (pos && mapRef.current) {
          mapRef.current.setView([pos.lat, pos.lng], 17);
        }
      });
    }

    return () => {
      safeRemoveMap(map);
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const goToMyLocation = useCallback(async () => {
    setLocating(true);
    const pos = await getCurrentPosition();
    setLocating(false);
    if (pos && mapRef.current) {
      mapRef.current.setView([pos.lat, pos.lng], 17);
    } else {
      toast.error("Joriy joylashuvni aniqlab bo'lmadi. Xaritadan qo'lda tanlang");
    }
  }, []);

  const handleConfirm = () => {
    onSelect({
      lat: Number(center.lat.toFixed(7)),
      lng: Number(center.lng.toFixed(7)),
    });
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="w-full overflow-hidden rounded-t-3xl bg-base-100 shadow-2xl lg:w-[640px] lg:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-200 px-4 py-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            Joyni belgilang
          </h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Xarita */}
        <div className="relative h-[55vh] lg:h-[420px]">
          <div ref={containerRef} className="h-full w-full" />

          {/* Markaziy pin — xarita surilganda joyida turadi (Telegram uslubi) */}
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 transition-transform duration-150 ${
              moving ? '-translate-y-[calc(100%+8px)]' : '-translate-y-full'
            }`}
          >
            <MapPin className="h-10 w-10 fill-primary stroke-primary-content drop-shadow-lg" />
          </div>
          {/* Pin soyasi (yer nuqtasi) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40" />

          {/* Joriy joylashuv tugmasi */}
          <button
            type="button"
            className="btn btn-circle absolute bottom-4 right-4 z-[1000] border-base-300 bg-base-100 shadow-lg"
            onClick={goToMyLocation}
            disabled={locating}
            title="Joriy joylashuvim"
          >
            {locating ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <LocateFixed className="h-5 w-5 text-primary" />
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="font-mono text-xs text-base-content/60">
            {formatCoords(center.lat, center.lng)}
          </p>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={saving || locating}
          >
            {saving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Shu joyni tanlash
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
