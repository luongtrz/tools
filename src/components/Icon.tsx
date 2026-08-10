import type { ReactNode } from "react";

const paths: Record<string, ReactNode> = {
  brand: (
    <>
      <path
        d="M5.25 3.75h8.5l5 5v11.5H5.25V3.75Z"
        fill="currentColor"
        opacity=".16"
      />
      <path d="M13.75 3.75v5h5M8 12h8M8 15.5h4" />
      <path d="m15.5 14.25.75 1.5 1.5.75-1.5.75-.75 1.5-.75-1.5-1.5-.75 1.5-.75.75-1.5Z" />
    </>
  ),
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.01c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
    />
  ),
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
      className={`size-4 shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths[name]}
    </svg>
  );
}
