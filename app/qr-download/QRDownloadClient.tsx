"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";

export default function QRDownloadClient() {
  const params = useSearchParams();
  const email = params.get("email");
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  useEffect(() => {
    if (email && containerRef.current && !hasDownloaded) {
      setTimeout(() => {
        html2canvas(containerRef.current!, {
          scale: 2,
          backgroundColor: "#fff",
        }).then((canvas) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `QR_Page_${email}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setHasDownloaded(true);
            }
          }, "image/png");
        });
      }, 500);
    }
  }, [email, hasDownloaded]);

  if (!email) {
    return (
      <div
        className="p-8 max-w-md mx-auto text-center"
        style={{ color: "#B91C1C" /* Tailwind red-700 hex */ }}
      >
        No email found in URL.
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    email
  )}`;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-8"
      style={{ backgroundColor: "#F9FAFB" /* Tailwind gray-50 hex */ }}
    >
      <div
        ref={containerRef}
        className="rounded shadow-md max-w-sm w-full p-8 text-center"
        style={{
          color: "#000000",
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h1 className="mb-4" style={{ fontWeight: 600, fontSize: "1.5rem" }}>
          🎉 QR Code Ready
        </h1>
        <p
          style={{
            marginBottom: "0.5rem",
            color: "#374151" /* Tailwind gray-700 */,
          }}
        >
          Email: <strong>{email}</strong>
        </p>
        <img
          src={qrCodeUrl}
          alt="QR Code"
          className="mx-auto rounded border border-gray-300"
          width={200}
          height={200}
        />
        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: "#6B7280" /* gray-500 */,
          }}
        >
          Your QR code page will be downloaded automatically.
        </p>
      </div>
    </div>
  );
}
