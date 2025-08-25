"use client";

import Link from 'next/link';

const KaspaLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-8 w-8 text-primary"
  >
    <path
      d="M12 10.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"
      opacity=".3"
    />
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.04 4.04l1.42 1.42-2.12 2.12-1.42-1.42 2.12-2.12zM7.96 6.46l1.42-1.42 2.12 2.12-1.42 1.42L7.96 6.46zM12 7.5c2.49 0 4.5 2.01 4.5 4.5s-2.01 4.5-4.5 4.5S7.5 14.49 7.5 12 9.51 7.5 12 7.5zm4.04 8.04l1.42 1.42-2.12 2.12-1.42-1.42 2.12-2.12zm-8.08 0l1.42 1.42-2.12 2.12-1.42-1.42 2.12-2.12zM4 12c0-1.1.9-2 2-2h.5l-1.04 1.04 1.42 1.42L8.92 10.5H10.5v1.5H8.92l-2.04 2.04-1.42-1.42L6.5 14H6c-1.1 0-2-.9-2-2zm14.5 0c0 .83-.67 1.5-1.5 1.5h-1.58l-1.04-1.04-1.42 1.42 2.04 2.04H13.5v-1.5h1.58l2.04-2.04 1.42 1.42L17.5 14H18c.83 0 1.5-.67 1.5-1.5z"
    />
  </svg>
);

export default function AuthHeader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 mb-8">
        <Link href="/" className="flex items-center gap-3">
          <KaspaLogo />
          <span className="text-2xl font-bold tracking-tight text-primary">KASPA POS</span>
        </Link>
    </div>
  )
}