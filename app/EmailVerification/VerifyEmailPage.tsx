"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient"; // Adjust path if needed

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalContent, setModalContent] = useState<"terms" | "privacy" | null>(
    null
  );

  const handleSendEmail = async () => {
    setError("");

    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from("sat_forum_email_verification")
        .select("*")
        .eq("email", email)
        .single();

      let token: string;

      if (existing) {
        // Update attempts +1
        const { data: updated, error: updateError } = await supabase
          .from("sat_forum_email_verification")
          .update({
            attempts: (existing.attempts ?? 0) + 1,
          })
          .eq("email", email)
          .select("token")
          .single();

        if (updateError || !updated) {
          console.error("Update error:", updateError);
          setError("Something went wrong. Please try again.");
          return;
        }

        token = updated.token;

        // Show error message if email already registered
        setError("This email is already registered.");
        setLoading(false);
        return;
      }

      // Else, insert new record
      const { data: inserted, error: insertError } = await supabase
        .from("sat_forum_email_verification")
        .insert([{ email }])
        .select("token")
        .single();

      if (insertError || !inserted) {
        console.error("Insert error:", insertError);
        setError("Something went wrong. Please try again.");
        return;
      }

      token = inserted.token;

      const verificationUrl = `${
        window.location.origin
      }/verify?token=${token}&email=${encodeURIComponent(email)}`;

      await emailjs.send(
        "service_1qkyi2i",
        "template_fwozquc",
        {
          to_email: email,
          verification_url: verificationUrl,
          email,
        },
        "sOTpCYbD5KllwgbCD"
      );

      setSent(true);
    } catch (err) {
      console.error("Email send error:", err);
      setError("Failed to send verification email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center items-center w-screen min-h-screen p-2">
      <div className="relative flex flex-col gap-8 p-12 w-[502px] min-h-[592px] mx-auto bg-white rounded-[24px] shadow-md text-gray-600">
        <div className="w-fit h-auto">
          <h1 className="text-[16px] font-bold">Register</h1>
          <div className="w-full h-[2px] bg-gray-500 mt-4"></div>
        </div>

        {!sent ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendEmail();
            }}
          >
            <p className="text-[14px] mb-8 italic">
              Please enter a valid, active email (e.g., example@domain.com). A
              confirmation link will be sent to it.
            </p>
            <label
              htmlFor="email"
              className="block text-[14px] font-medium mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
              aria-invalid={!!error}
            />

            <div className="min-h-[16px] mt-2">
              {error && <p className="text-[#ff0000] text-[10px]">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 py-2 px-4 rounded text-white ${
                loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Sending..." : "Send Verification Email"}
            </button>
          </form>
        ) : (
          <>
            <div>
              <p className="italic text-[14px] mb-4 text-center">
                Check your email to verify.
              </p>
              <Image
                src="/assets/paper_airplane_send_with_dotted_lines_flat_style.jpg"
                alt="Email"
                width={400}
                height={400}
              />
            </div>
          </>
        )}

        <div className="mt-auto px-4 flex flex-col justify-center items-center text-center">
          <div className="flex items-start space-x-2">
            <label htmlFor="agree" className="text-[11px] text-gray-700">
              By continuing, I agree with the{" "}
              <button
                type="button"
                onClick={() => setModalContent("terms")}
                className="text-blue-600 underline hover:text-blue-800"
              >
                Terms & Conditions
              </button>{" "}
              and <br />
              <button
                type="button"
                onClick={() => setModalContent("privacy")}
                className="text-blue-600 underline hover:text-blue-800"
              >
                Privacy Policy
              </button>
              .
            </label>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white max-w-lg w-full rounded-lg shadow-lg p-6 relative">
            <h2 className="text-xl font-semibold mb-4">
              {modalContent === "terms"
                ? "Terms & Conditions"
                : "Privacy Policy"}
            </h2>
            <div className="text-sm max-h-[300px] overflow-y-auto space-y-2 text-gray-700">
              {modalContent === "terms" ? (
                <>
                  <p>
                    These Terms & Conditions govern your access to and use of
                    our services...
                  </p>
                  <p>[Add more detailed terms here]</p>
                </>
              ) : (
                <>
                  <p>
                    This Privacy Policy describes how we collect, use, and
                    protect your information...
                  </p>
                  <p>[Add more detailed privacy info here]</p>
                </>
              )}
            </div>
            <button
              onClick={() => setModalContent(null)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-lg"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
