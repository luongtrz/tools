import type { ReactNode } from "react";

const paths: Record<string, ReactNode> = {
  file: (
    <>
      <path d="M6 3.75h8.172L18.5 8.078V20.25H6V3.75Z" />
      <path d="M14 3.75v4.5h4.5M8.75 12h7M8.75 15h5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19.25h14" />
    </>
  ),
  print: (
    <>
      <path d="M6.5 8.5V4.75h11V8.5M6 17.25H4.75a1 1 0 0 1-1-1v-5.5a1 1 0 0 1 1-1h14.5a1 1 0 0 1 1 1v5.5H18M6.5 14.5h11v5h-11v-5Z" />
      <path d="M17 11.5h.01" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.25" />
      <circle cx="6" cy="12" r="2.25" />
      <circle cx="18" cy="18.5" r="2.25" />
      <path d="m8.05 10.9 7.9-4.25M8.05 13.1l7.9 4.25" />
    </>
  ),
  reset: (
    <>
      <path d="M4.75 8.25A8 8 0 1 1 4.5 14" />
      <path d="M4.75 4.75v3.5h3.5" />
    </>
  ),
  fileDocument: (
    <>
      <path
        d="M4.5 5.75A2.25 2.25 0 0 1 6.75 3.5h7.628c.597 0 1.17.237 1.592.659l3.871 3.871c.422.422.659.995.659 1.592v8.628a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V5.75Z"
        fill="currentColor"
        opacity=".22"
      />
      <path d="M14.25 3.75V8a1 1 0 0 0 1 1h4.25M8 12.25l2.15 2.15L16 8.55M8 17h8" />
    </>
  ),
};

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  className?: string;
}

export default function Icon({ name, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths[name]}
    </svg>
  );
}
