"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabaseClient";

export default function QRDownloadClient() {
  const params = useSearchParams();
  const email = params.get("email");
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState<string>("");
  const [eventTitles, setEventTitles] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<
    "event1" | "event2" | "both" | null
  >(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!email) {
        setIsValidEmail(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("sat_forum_registrations")
        .select("first_name, last_name, selected_events")
        .ilike("email", decodeURIComponent(email))
        .single();

      if (error || !data) {
        console.error("Supabase error:", error);
        setIsValidEmail(false);
      } else {
        setIsValidEmail(true);
        setUserName(`${data.first_name} ${data.last_name}`);

        const events = data.selected_events || [];

        const hasEvent1 = events.includes("event1");
        const hasEvent2 = events.includes("event2");

        let date = "";
        const titles: string[] = [];

        if (hasEvent1 && hasEvent2) {
          setSelectedCase("both");
          date = "JULY 17&24, 2025";
          titles.push(
            "Eggsponential Progress: The Future of Layer Farming",
            "Pork Forward: Trailblazing the Path to Advanced Swine Production"
          );
        } else if (hasEvent1) {
          setSelectedCase("event1");
          date = "JULY 17, 2025";
          titles.push("Eggsponential Progress: The Future of Layer Farming");
        } else if (hasEvent2) {
          setSelectedCase("event2");
          date = "JULY 24, 2025";
          titles.push(
            "Pork Forward: Trailblazing the Path to Advanced Swine Production"
          );
        }

        setEventDate(date);
        setEventTitles(titles);
      }

      setIsLoading(false);
    };

    fetchUserInfo();
  }, [email]);

  useEffect(() => {
    if (isValidEmail && containerRef.current && !hasDownloaded) {
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
  }, [isValidEmail, hasDownloaded, email]);

  if (!email) {
    return (
      <div style={{ color: "#B91C1C", textAlign: "center", padding: "2rem" }}>
        No email found in URL.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        Verifying email...
      </div>
    );
  }

  if (!isValidEmail) {
    return (
      <div style={{ color: "#B91C1C", textAlign: "center", padding: "2rem" }}>
        Invalid or unregistered email.
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
      }}
    >
      <div
        ref={containerRef}
        style={{
          backgroundColor: "transparent",
          maxWidth: "360px",
          width: "100%",
          paddingBlock: "60px",
          textAlign: "center",
          color: "#000",
          // fontFamily:
          //   "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
          position: "relative",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "auto" }}>
          <img
            src="/assets/Ticket.png"
            alt="Ticket"
            crossOrigin="anonymous"
            style={{ width: "100%", height: "auto", display: "block" }}
          />

          {/* ✅ Name and Registration Confirmation */}
          {userName && (
            <div
              style={{
                position: "absolute",
                top: "17.5%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "20px",
                fontWeight: "600",
                color: "#fff",
                width: "100%",
              }}
            >
              {userName}
              <br />
              Your Registration is Confirmed!
            </div>
          )}

          {/* ✅ Event Date and Titles */}
          {(eventDate || eventTitles.length > 0) && (
            <div
              style={{
                position: "absolute",
                top: "51.5%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width:
                  selectedCase === "event1"
                    ? "70%"
                    : selectedCase === "event2"
                    ? "90%"
                    : "80%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                color: "#fff",
                rowGap:
                  selectedCase === "event1"
                    ? "10px"
                    : selectedCase === "event2"
                    ? ""
                    : "",
              }}
            >
              <div
                style={{
                  fontSize:
                    selectedCase === "event1"
                      ? "18px"
                      : selectedCase === "event2"
                      ? "18px"
                      : "14px",
                  lineHeight: "24px",
                  letterSpacing: "9px",
                  color: "#fff",
                }}
              >
                {eventDate}
              </div>
              <div
                style={{
                  fontSize:
                    selectedCase === "event1"
                      ? "18px"
                      : selectedCase === "event2"
                      ? "18px"
                      : "12px",
                  fontWeight: "700",
                  whiteSpace: "pre-line",
                  lineHeight:
                    selectedCase === "event1"
                      ? ""
                      : selectedCase === "event2"
                      ? ""
                      : "20px",
                  color: "#fff",
                  paddingInline:
                    selectedCase === "event1"
                      ? ""
                      : selectedCase === "event2"
                      ? ""
                      : "30px",
                }}
              >
                {eventTitles.join("\n")}
              </div>
            </div>
          )}

          {/* ✅ QR Code with Logo */}
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
              style={{ width: "100%", height: "100%", display: "block" }}
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
