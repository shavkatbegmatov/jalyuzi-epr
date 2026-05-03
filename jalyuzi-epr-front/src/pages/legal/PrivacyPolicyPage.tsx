import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-base-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/login" className="link link-primary text-sm">
            ← Kirish sahifasiga qaytish
          </Link>
        </div>

        <article className="prose prose-sm sm:prose-base max-w-none">
          <h1>Maxfiylik siyosati (Privacy Policy)</h1>
          <p className="text-base-content/70">
            Oxirgi yangilangan: 2026-yil 3-may
          </p>

          <h2>1. Umumiy ma'lumot</h2>
          <p>
            <strong>Jalyuzi ERP</strong> ("biz", "bizning", "ilova") — savdo va
            zaxira nazorati uchun ishlab chiqilgan ERP tizimi. Ushbu maxfiylik
            siyosati ilova foydalanuvchi ma'lumotlarini qanday yig'ishi,
            ishlatishi va himoyalashini tushuntiradi.
          </p>

          <h2>2. Yig'iladigan ma'lumotlar</h2>
          <p>Biz quyidagi ma'lumotlarni yig'amiz:</p>
          <ul>
            <li>
              <strong>Hisob ma'lumotlari:</strong> ism, familya, telefon raqam,
              elektron pochta, lavozim
            </li>
            <li>
              <strong>Biznes ma'lumotlar:</strong> mahsulotlar, mijozlar,
              sotuvlar, qarzlar, omborxona ma'lumotlari (faqat sizning
              tashkilotingiz doirasida)
            </li>
            <li>
              <strong>Texnik ma'lumotlar:</strong> qurilma turi, OS versiyasi,
              IP-manzil (xavfsizlik va xatoliklarni aniqlash uchun)
            </li>
            <li>
              <strong>Audit jurnallari:</strong> tizimda bajarilgan amallar
              tarixi (vaqt, foydalanuvchi, harakat)
            </li>
          </ul>

          <h2>3. Ma'lumotlardan foydalanish</h2>
          <p>Yig'ilgan ma'lumotlar quyidagi maqsadlarda ishlatiladi:</p>
          <ul>
            <li>ERP tizimi xizmatlarini taqdim etish</li>
            <li>Foydalanuvchi hisobini tasdiqlash va xavfsizlikni ta'minlash</li>
            <li>Tizim ishlashini yaxshilash va xatoliklarni bartaraf etish</li>
            <li>Qonuniy talablarga muvofiq audit yuritish</li>
          </ul>

          <h2>4. Ma'lumotlarni uchinchi tomonlarga taqdim etish</h2>
          <p>
            Biz sizning ma'lumotlaringizni <strong>uchinchi tomonlarga sotmaymiz
            yoki bermaymiz</strong>, quyidagi holatlardan tashqari:
          </p>
          <ul>
            <li>Sizning aniq roziligingiz bilan</li>
            <li>Qonun talab qilganda (sud qarori, prokuror talabi va h.k.)</li>
            <li>
              Texnik xizmat ko'rsatuvchi provayderlar (hosting, monitoring) —
              ular ham maxfiylikni saqlash majburiyatiga ega
            </li>
          </ul>

          <h2>5. Ma'lumotlarni saqlash va xavfsizligi</h2>
          <ul>
            <li>
              Ma'lumotlar shifrlangan kanal (HTTPS/TLS) orqali uzatiladi
            </li>
            <li>Parollar bcrypt algoritmi bilan xeshlangan holda saqlanadi</li>
            <li>Hisobga kirish JWT (24 soatlik) tokenlar bilan himoyalangan</li>
            <li>
              Server O'zbekiston/Yevropa hududida joylashgan, GDPR talablariga
              muvofiq
            </li>
          </ul>

          <h2>6. Foydalanuvchi huquqlari</h2>
          <p>Sizning huquqlaringiz:</p>
          <ul>
            <li>Sizning ma'lumotlaringizni ko'rish va eksport qilish</li>
            <li>
              Noto'g'ri ma'lumotlarni tuzatishni so'rash
            </li>
            <li>
              Hisobingizni va ma'lumotlaringizni o'chirishni so'rash
            </li>
            <li>
              Ma'lumotlardan foydalanishga rozilikni qaytarib olish
            </li>
          </ul>

          <h2>7. Cookie va lokal saqlash</h2>
          <p>
            Ilova quyidagilarni qurilmangizda saqlaydi:
          </p>
          <ul>
            <li>JWT autentifikatsiya tokenlari</li>
            <li>Foydalanuvchi sozlamalari (til, mavzu)</li>
            <li>Vaqtinchalik cache (TanStack Query)</li>
          </ul>

          <h2>8. Bolalar maxfiyligi</h2>
          <p>
            Ilova 13 yoshdan kichik bolalar uchun mo'ljallanmagan. Biz bolalardan
            ataylab ma'lumot yig'maymiz.
          </p>

          <h2>9. Maxfiylik siyosatining o'zgarishi</h2>
          <p>
            Ushbu siyosat vaqti-vaqti bilan yangilanishi mumkin. Muhim
            o'zgarishlar haqida sizga elektron pochta yoki ilova ichidagi
            xabarnoma orqali ma'lum qilamiz.
          </p>

          <h2>10. Aloqa</h2>
          <p>
            Maxfiylik bilan bog'liq savollar uchun:
          </p>
          <ul>
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@kanjaltib.uz">support@kanjaltib.uz</a>
            </li>
            <li>
              <strong>Vebsayt:</strong>{' '}
              <a href="https://kanjaltib.uz">kanjaltib.uz</a>
            </li>
          </ul>
        </article>
      </div>
    </div>
  );
}
