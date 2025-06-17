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
      // small delay to ensure everything is rendered
      setTimeout(() => {
        html2canvas(containerRef.current!, {
          scale: 2,
          backgroundColor: "#fff", // white background for the image
          useCORS: true, // Enable cross-origin support for images
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
        style={{
          color: "#B91C1C", // Tailwind red-700 hex
          padding: "2rem",
          maxWidth: "400px",
          margin: "auto",
          textAlign: "center",
        }}
      >
        No email found in URL.
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    email
  )}&ecc=H`; // High error correction

  return (
    <div
      style={{
        backgroundColor: "#F9FAFB", // Tailwind gray-50 hex
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <div
        ref={containerRef}
        style={{
          backgroundColor: "#fff",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          borderRadius: "0.5rem",
          maxWidth: "360px",
          width: "100%",
          padding: "2rem",
          textAlign: "center",
          color: "#000",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        <h1
          style={{
            fontWeight: 600,
            fontSize: "1.5rem",
            marginBottom: "1rem",
          }}
        >
          🎉 QR Code Ready
        </h1>
        <p
          style={{
            marginBottom: "0.5rem",
            color: "#374151", // Tailwind gray-700
            fontSize: "1rem",
          }}
        >
          Email: <strong>{email}</strong>
        </p>
        <div
          style={{
            position: "relative",
            display: "inline-block",
            width: "200px",
            height: "200px",
            margin: "1rem auto",
          }}
        >
          <img
            src={qrCodeUrl}
            alt="QR Code"
            width={200}
            height={200}
            crossOrigin="anonymous"
            style={{
              borderRadius: "0.25rem",
              border: "1px solid #D1D5DB", // Tailwind gray-300
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
          <img
            src="/assets/Asset 22 1.png"
            alt="Logo"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "48px",
              height: "48px",
              transform: "translate(-50%, -50%)",
              borderRadius: "0.25rem",
              backgroundColor: "#ffffff",
              padding: "0.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </div>

        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: "#6B7280", // Tailwind gray-500
          }}
        >
          Your QR code page will be downloaded automatically.
        </p>
      </div>
    </div>
  );
}
