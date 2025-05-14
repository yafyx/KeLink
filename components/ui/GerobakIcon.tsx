import React from "react";

interface GerobakIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const GerobakIcon: React.FC<GerobakIconProps> = ({
  className,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Cart Base */}
      <rect x="2" y="10" width="16" height="8" rx="1" />

      {/* Wheels */}
      <circle cx="6" cy="18" r="2" />
      <circle cx="14" cy="18" r="2" />

      {/* Cart Top/Canopy */}
      <path d="M2 10V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3" />

      {/* Handle */}
      <path d="M18 14h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2" />

      {/* Food Items Suggestion */}
      <line x1="5" y1="8" x2="5" y2="6" />
      <line x1="9" y1="8" x2="9" y2="6" />
      <line x1="13" y1="8" x2="13" y2="6" />
    </svg>
  );
};

export default GerobakIcon;
