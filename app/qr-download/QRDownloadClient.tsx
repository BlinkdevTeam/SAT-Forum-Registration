"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function QRDownloadClient() {
  const params = useSearchParams();
  const email = params.get("email");
  const qrRef = useRef<HTMLImageElement>(null);
  const [shouldDownload, setShouldDownload] = useState(false);

  const qrCodeUrl = email
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        email
      )}`
    : "";

  useEffect(() => {
    if (email) setShouldDownload(true);
  }, [email]);

  const handleImageLoad = () => {
    if (qrRef.current && shouldDownload) {
      const link = document.createElement("a");
      link.href = qrRef.current.src;
      link.download = `QR_Code_${email || "user"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShouldDownload(false);
    }
  };

  if (!email) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-red-600">
        No email found in URL.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-2xl font-semibold mb-4">🎉 QR Code Ready</h1>
        <p className="mb-2 text-gray-700">
          Email: <strong>{email}</strong>
        </p>
        <img
          ref={qrRef}
          src={qrCodeUrl}
          alt="QR Code"
          onLoad={handleImageLoad}
          className="mx-auto border border-gray-300 rounded"
          width={200}
          height={200}
        />
        <p className="mt-4 text-sm text-gray-500">
          Your QR code should start downloading automatically.
        </p>
      </div>
    </div>
  );
}
