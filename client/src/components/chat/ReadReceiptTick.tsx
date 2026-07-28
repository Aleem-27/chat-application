export function ReadReceiptTick({ read }: { read: boolean }) {
  return (
    <svg
      width="16"
      height="12"
      viewBox="0 0 20 16"
      fill="none"
      className={read ? 'text-emerald-300' : 'text-white/55'}
    >
      {read && (
        <path
          d="M1 8.5L4.5 12L11 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      <path
        d={read ? 'M7 8.5L10.5 12L17 4.5' : 'M3 8.5L6.5 12L13 4.5'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
