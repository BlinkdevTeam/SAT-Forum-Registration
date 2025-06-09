"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import emailjs from "@emailjs/browser";

export default function VerifyPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState<string | null>(null);
  const [hasSent, setHasSent] = useState(false);

  useEffect(() => {
    if (token) {
      const storedEmail = localStorage.getItem(token);
      if (storedEmail) {
        setEmail(storedEmail);
        localStorage.removeItem(token);
      }
    }
  }, [token]);

  useEffect(() => {
    if (email && !hasSent) {
      // Example: QR code image could be a static URL or generated from your server
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        email
      )}`;

      const templateParams = {
        email,
        qr_code_url: qrCodeUrl,
      };

      emailjs
        .send(
          "service_1qkyi2i", // your EmailJS service ID
          "template_28r3rcr", // your EmailJS template ID for QR code
          templateParams,
          "sOTpCYbD5KllwgbCD" // your public key
        )
        .then(() => {
          console.log("QR code email sent!");
          setHasSent(true);
        })
        .catch((error) => {
          console.error("Failed to send QR email:", error);
        });
    }
  }, [email, hasSent]);

  return (
    <div className="p-8 max-w-md mx-auto">
      {email ? (
        <div className="text-green-600">
          <h1 className="text-xl font-semibold mb-2">Email Verified!</h1>
          <p>{email} has been successfully verified.</p>
          <p className="mt-4 text-sm text-gray-700">
            A QR code has also been sent to your email.
          </p>
        </div>
      ) : (
        <div className="text-red-600">
          <h1 className="text-xl font-semibold mb-2">
            Invalid or Expired Link
          </h1>
          <p>Please request a new verification email.</p>
        </div>
      )}
    </div>
  );
}
