type IconProps = { className?: string };

export function NavIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const props: IconProps = { className };

  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      );
    case "file":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      );
    case "coins":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <path d="M11 15h2a2 2 0 100-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
          <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 00-2.75-2.91l-4.2 3.9" />
          <path d="m2 16 6 6" />
          <circle cx="16" cy="9" r="2.9" />
          <circle cx="6" cy="5" r="3" />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
        </svg>
      );
    case "hospital":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <path d="M12 7v4M14 21v-3a2 2 0 00-4 0v3M14 9h-4" />
          <path d="M18 11h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-9a2 2 0 012-2h2" />
          <path d="M18 21V5a2 2 0 00-2-2H8a2 2 0 00-2 2v16" />
        </svg>
      );
    case "medicine":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14h-2v-4H8v-2h2V7h2v4h2v2h-2v4z" />
        </svg>
      );
    case "dollar":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
        </svg>
      );
    case "aim":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-12a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      );
    case "support":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
        </svg>
      );
    case "headset":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 1a9 9 0 00-9 9v7c0 1.66 1.34 3 3 3h1v-8H5v-2a7 7 0 0114 0v2h-2v8h1c1.66 0 3-1.34 3-3v-7a9 9 0 00-9-9z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
}

export function PlusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}

export function EditIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}
