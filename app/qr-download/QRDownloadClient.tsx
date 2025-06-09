"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";

export default function QRDownloadClient() {
  const params = useSearchParams();
  const email = params.get("email");
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // Automatically capture and download when email exists and not yet downloaded
  useEffect(() => {
    if (email && containerRef.current && !hasDownloaded) {
      // small delay to ensure rendering
      setTimeout(() => {
        html2canvas(containerRef.current!, {
          scale: 2,
          backgroundColor: "#fff",
          // you can add useCORS: true if needed for images
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
      <div className="p-8 max-w-md mx-auto text-center text-red-600">
        No email found in URL.
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    email
  )}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div
        ref={containerRef}
        className="bg-white p-8 rounded shadow-md text-center max-w-sm w-full"
        style={{ color: "#000" }}
      >
        <h1 className="text-2xl font-semibold mb-4">🎉 QR Code Ready</h1>
        <p className="mb-2 text-gray-700">
          Email: <strong>{email}</strong>
        </p>
        <img
          src={qrCodeUrl}
          alt="QR Code"
          className="mx-auto border border-gray-300 rounded"
          width={200}
          height={200}
        />
        <p className="mt-4 text-sm text-gray-500">
          Your QR code page will be downloaded automatically.
        </p>
      </div>
    </div>
  );
}
