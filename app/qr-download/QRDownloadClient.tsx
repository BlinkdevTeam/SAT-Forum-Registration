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
          backgroundColor: "transparent",
          useCORS: true,
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
          color: "#B91C1C",
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
  )}&ecc=H`;

  return (
    <div
      style={{
        backgroundColor: "transparent",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // padding: "2rem",
      }}
    >
      <div
        ref={containerRef}
        style={{
          backgroundColor: "transparent",
          // boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          // borderRadius: "0.5rem",
          maxWidth: "360px",
          width: "100%",
          padding: "2rem",
          textAlign: "center",
          color: "#000",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
          position: "relative",
        }}
      >
        {/* Relative container for ticket + QR */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "auto",
          }}
        >
          {/* Ticket background image */}
          <img
            src="/assets/Ticket 1.png"
            alt="Ticket"
            crossOrigin="anonymous"
            style={{
              width: "100%",
              height: "auto",
              // borderRadius: "0.25rem",
              // border: "1px solid #D1D5DB",
              display: "block",
            }}
          />

          {/* QR + logo block positioned absolutely over ticket */}
          <div
            style={{
              position: "absolute",
              top: "32.5%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "160px",
              height: "160px",
            }}
          >
            <img
              src={qrCodeUrl}
              alt="QR Code"
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                // borderRadius: "0.25rem",
                // border: "1px solid #D1D5DB",
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
                transform: "translate(-50%, -50%)",
                width: "35px",
                height: "35px",
                backgroundColor: "#fff",
                borderRadius: "0.25rem",
                padding: "0.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
