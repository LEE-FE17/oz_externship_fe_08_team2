export function ProfileIcon({ size = 40 }) {
  return (
    <svg
      width={`${size}`}
      height={`${size}`}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="20" fill="#ede6ff" />
      <circle cx="20" cy="16" r="6" fill="#986be9" />
      <path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#986be9" />
    </svg>
  )
}
