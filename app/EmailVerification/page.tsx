"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
// import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  //   const router = useRouter();

  const handleSendEmail = async () => {
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    const token = uuidv4();
    const verificationUrl = `${window.location.origin}/verify?token=${token}`;

    const templateParams = {
      to_email: email, // required for sending
      verification_url: verificationUrl,
      email: email, // 🔥 this is what {{email}} maps to in the template
    };

    try {
      setLoading(true);
      await emailjs.send(
        "service_1qkyi2i",
        "template_fwozquc",
        templateParams,
        "sOTpCYbD5KllwgbCD"
      );

      localStorage.setItem(token, email); // Temporary for demo
      setSent(true);
    } catch (error) {
      console.error("Email send error:", error);
      alert("Failed to send verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Email Verification</h1>
      {!sent ? (
        <>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-4 py-2 w-full rounded mb-4"
          />
          <button
            onClick={handleSendEmail}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            {loading ? "Sending..." : "Send Verification Email"}
          </button>
        </>
      ) : (
        <p className="text-green-600">
          A verification email has been sent to {email}
        </p>
      )}
    </div>
  );
}
