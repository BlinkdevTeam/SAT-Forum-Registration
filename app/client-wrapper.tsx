// app/client-wrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import React from "react";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isQRDownloadPage = pathname === "/qr-download";

  return (
    <>
      {/* 🎥 Conditional video background */}
      {!isQRDownloadPage && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="fixed top-0 left-0 w-full h-full object-cover pointer-events-none z-[-1]"
        >
          <source
            src="/assets/DESKTOP.mp4"
            type="video/mp4"
            media="(min-width: 1024px)"
          />
          <source
            src="/assets/TABLET.mp4"
            type="video/mp4"
            media="(min-width: 640px)"
          />
          <source
            src="/assets/MOBILE.mp4"
            type="video/mp4"
            media="(max-width: 639px)"
          />
          Your browser does not support the video tag.
        </video>
      )}
      <div className={isQRDownloadPage ? "custom-static-bg" : ""}>
        {children}
      </div>
    </>
  );
}
