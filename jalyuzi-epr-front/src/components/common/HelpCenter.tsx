import { useEffect } from 'react';
import {
  X,
  Rocket,
  ClipboardList,
  Users,
  Wallet,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface HelpCenterProps {
  open: boolean;
  onClose: () => void;
  /** Birinchi kirishda — yuqorida "Xush kelibsiz" banneri ko'rsatiladi */
  isFirstVisit?: boolean;
}

interface HelpSection {
  icon: LucideIcon;
  title: string;
  items: string[];
}

// Asosiy oqimlar bo'yicha qisqa yo'riqnoma — yangi foydalanuvchini tez ishga tushirish uchun
const HELP_SECTIONS: HelpSection[] = [
  {
    icon: Rocket,
    title: 'Qanday boshlash kerak?',
    items: [
      "Chap tomondagi menyudan kerakli bo'limni tanlang.",
      "Menyu guruhlarga bo'lingan: Savdo, Mijozlar, Ombor va boshqalar.",
      "Faqat sizning rolingizga ruxsat berilgan bo'limlar ko'rinadi.",
    ],
  },
  {
    icon: ClipboardList,
    title: 'Yangi buyurtma yaratish',
    items: [
      "Savdo → Buyurtmalar bo'limiga o'ting.",
      '"Yangi buyurtma" tugmasini bosing.',
      "Bosqichma-bosqich: mijozni tanlang → o'lcham va mahsulot qo'shing → tasdiqlang.",
    ],
  },
  {
    icon: Users,
    title: "Mijoz qo'shish",
    items: [
      'Mijozlar bo\'limida "Yangi mijoz" tugmasini bosing.',
      "Ism va telefon raqamini kiriting (+998 formatida).",
    ],
  },
  {
    icon: Wallet,
    title: "To'lov qabul qilish",
    items: [
      'Buyurtma sahifasida "To\'lov qo\'shish" tugmasini bosing.',
      "Summani va to'lov usulini (naqd, karta, o'tkazma) tanlang.",
    ],
  },
  {
    icon: Search,
    title: 'Tezkor qidiruv',
    items: [
      "Yuqoridagi qidiruv maydonidan mijoz, buyurtma yoki mahsulotni tez toping.",
    ],
  },
];

export function HelpCenter({ open, onClose, isFirstVisit = false }: HelpCenterProps) {
  // Escape tugmasi bilan yopish
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl p-0 overflow-hidden">
        {/* Sarlavha */}
        <div className="relative flex items-center justify-between border-b border-base-200 px-5 py-4">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">
                {isFirstVisit ? 'Xush kelibsiz! 👋' : 'Yordam markazi'}
              </h3>
              <p className="text-xs text-base-content/60">
                {isFirstVisit
                  ? "Tizimdan foydalanishni boshlash bo'yicha qisqa qo'llanma"
                  : "Asosiy amallar bo'yicha qo'llanma"}
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-square relative"
            onClick={onClose}
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Kontent */}
        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-5 py-4">
          {HELP_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="collapse collapse-arrow rounded-xl border border-base-200 bg-base-100"
            >
              <input type="checkbox" />
              <div className="collapse-title flex items-center gap-3 text-sm font-semibold">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-base-200/70 text-primary">
                  <section.icon className="h-4 w-4" />
                </span>
                {section.title}
              </div>
              <div className="collapse-content">
                <ul className="ml-11 list-disc space-y-1.5 text-sm text-base-content/70">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Aloqa */}
          <div className="mt-3 flex items-start gap-3 rounded-xl bg-base-200/50 px-4 py-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div className="text-sm">
              <p className="font-semibold">Savol yoki muammo bo'lsa</p>
              <p className="text-base-content/60">
                Tizim administratori bilan bog'laning. Sozlamalar bo'limida qo'shimcha
                ma'lumotlarni topishingiz mumkin.
              </p>
            </div>
          </div>
        </div>

        {/* Pastki tugma */}
        <div className="border-t border-base-200 px-5 py-3">
          <button className="btn btn-primary w-full" onClick={onClose}>
            {isFirstVisit ? 'Tushunarli, boshlaymiz!' : 'Yopish'}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
