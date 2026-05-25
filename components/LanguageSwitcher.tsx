import Link from 'next/link';

export interface EditionLink {
  id: string;
  language: string;
  title: string;
}

interface LanguageSwitcherProps {
  currentId: string;
  currentLang: string;
  editions: EditionLink[];
}

export default function LanguageSwitcher({
  currentId,
  currentLang,
  editions,
}: LanguageSwitcherProps) {
  if (editions.length <= 1) return null;

  const sorted = [...editions].sort((a, b) =>
    a.language === 'en' ? -1 : b.language === 'en' ? 1 : 0,
  );

  return (
    <div className="mb-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">
        Idioma de la edición
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((ed) => {
          const active = ed.id === currentId;
          const label = ed.language === 'es' ? 'Español' : 'English';
          const flag = ed.language === 'es' ? '🇪🇸' : '🇺🇸';

          return (
            <Link
              key={ed.id}
              href={`/book/${ed.id}`}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                active
                  ? 'bg-primary text-black border-primary shadow-lg'
                  : 'bg-card text-gray-300 border-gray-700 hover:border-primary/50 hover:text-white'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {flag} {label}
            </Link>
          );
        })}
      </div>
      {currentLang === 'es' &&
        editions.some((e) => e.language === 'es' && e.id === currentId) && (
          <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
            Las ediciones marcadas con traducción oficial en Project Gutenberg usan texto en
            español. Otras muestran portada en español y pueden abrir el original en inglés.
          </p>
        )}
    </div>
  );
}
