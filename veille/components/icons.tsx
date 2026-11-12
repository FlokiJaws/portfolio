type P = { size?: number; filled?: boolean; className?: string };

const base = (size: number) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});

export const FeedIcon = ({ size = 23 }: P) => (
  <svg {...base(size)}><path d="M4 6h16M4 12h16M4 18h10" /></svg>
);
export const AlertIcon = ({ size = 23 }: P) => (
  <svg {...base(size)}><path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" /><path d="M12 10v4.2" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></svg>
);
export const StarIcon = ({ size = 23, filled }: P) => (
  <svg {...base(size)} fill={filled ? "currentColor" : "none"}><path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.6Z" /></svg>
);
export const GearIcon = ({ size = 23 }: P) => (
  <svg {...base(size)}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2.2" /><circle cx="9" cy="17" r="2.2" /></svg>
);
export const RefreshIcon = ({ size = 19, className }: P) => (
  <svg {...base(size)} className={className}><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v4.5h-4.5" /></svg>
);
export const CheckAllIcon = ({ size = 19 }: P) => (
  <svg {...base(size)}><path d="m2.5 12.5 4 4 8-9" /><path d="m12 16 1 .5 8.5-9" /></svg>
);
export const SearchIcon = ({ size = 17 }: P) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const CloseIcon = ({ size = 15 }: P) => (
  <svg {...base(size)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const ShareIcon = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M12 15V3.5M7.5 7.5 12 3l4.5 4.5" /><path d="M6 11.5v7a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-7" /></svg>
);
export const ExternalIcon = ({ size = 17 }: P) => (
  <svg {...base(size)}><path d="M9 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V15" /><path d="M13 5h6v6M19 5l-8 8" /></svg>
);
