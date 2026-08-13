interface EquipmentIconProps {
  className?: string;
}

export default function EquipmentIcon({ className }: EquipmentIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="14" width="36" height="24" rx="2" />
      <rect x="12" y="20" width="10" height="8" />
      <circle cx="32" cy="24" r="4" />
      <line x1="16" y1="6" x2="16" y2="14" />
      <line x1="24" y1="6" x2="24" y2="14" />
      <line x1="32" y1="6" x2="32" y2="14" />
      <line x1="12" y1="38" x2="12" y2="42" />
      <line x1="36" y1="38" x2="36" y2="42" />
    </svg>
  );
}
