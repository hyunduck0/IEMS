import Link from "next/link";

const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: (
      <path d="M4 12 12 5l8 7M6 10v9h5v-5h2v5h5v-9" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/history",
    label: "이력",
    icon: (
      <>
        <path d="M12 7v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="13" r="8" />
        <path d="M9 2h6" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/stats",
    label: "통계",
    icon: <path d="M5 20V10M12 20V4M19 20v-7" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/users",
    label: "사용자관리",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-4 3.5-6.5 7-6.5S19 16 19 20" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

export default function NavBar() {
  return (
    <nav className="border-b border-grid bg-panel/80 backdrop-blur px-6 py-3 flex items-center gap-8">
      <div className="flex items-center gap-2 pr-6 border-r border-grid">
        <span className="w-2 h-2 rounded-full bg-normal shadow-[0_0_8px_var(--color-normal)] animate-pulse" />
        <span className="font-hud text-sm tracking-[0.2em] text-text">IEMS</span>
      </div>

      <div className="flex gap-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-2 px-3 py-1.5 rounded border border-transparent text-muted hover:text-signal hover:border-signal/40 hover:bg-signal/5 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              {item.icon}
            </svg>
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
