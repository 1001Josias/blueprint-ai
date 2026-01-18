import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="80" height="80" rx="16" fill="url(#gradient-logo)" />
      <path
        d="M24 28H56M24 40H48M24 52H40"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="56" cy="52" r="8" fill="white" fillOpacity="0.9" />
      <path
        d="M54 52L55.5 53.5L58.5 50.5"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="gradient-logo"
          x1="0"
          y1="0"
          x2="80"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}
