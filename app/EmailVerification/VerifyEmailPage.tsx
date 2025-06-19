"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient"; // Adjust path if needed
import LeftColumn from "../components/LeftColumn";

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
     // 🔍 1. Check if already in sat_forum_registrations
     const { data: registered } = await supabase
       .from("sat_forum_registrations")
       .select("email")
       .ilike("email", email)
       .maybeSingle();

     let token: string;

     if (registered) {
       // 📬 2. Already registered — get or create token
       const { data: existing } = await supabase
         .from("sat_forum_email_verification")
         .select("*")
         .ilike("email", email)
         .maybeSingle();

       if (existing) {
         // 🔁 Update attempts
         await supabase
           .from("sat_forum_email_verification")
           .update({ attempts: (existing.attempts ?? 0) + 1 })
           .ilike("email", email);

         token = existing.token;
       } else {
         // 🆕 Insert new record with generated token
         const newToken = crypto.randomUUID();
         const { error: insertError } = await supabase
           .from("sat_forum_email_verification")
           .insert([{ email, token: newToken, attempts: 1 }]);

         if (insertError) throw insertError;

         token = newToken;
       }

       // ✉️ Send already registered email
       const verificationUrl = `${
         window.location.origin
       }/verify?token=${token}&email=${encodeURIComponent(email)}`;
       await emailjs.send(
         "service_1qkyi2i",
         "template_28r3rcr",
         {
           to_email: email,
           verification_url: verificationUrl,
           email,
         },
         "sOTpCYbD5KllwgbCD"
       );

       setSent(true);
       return;
     }

     // 🔍 3. Not registered — check verification table
     const { data: existing } = await supabase
       .from("sat_forum_email_verification")
       .select("*")
       .ilike("email", email)
       .maybeSingle();

     if (existing) {
       // 🔁 Update attempts
       await supabase
         .from("sat_forum_email_verification")
         .update({ attempts: (existing.attempts ?? 0) + 1 })
         .ilike("email", email);

       token = existing.token;
     } else {
       // 🆕 Insert new
       const newToken = crypto.randomUUID();
       const { error: insertError } = await supabase
         .from("sat_forum_email_verification")
         .insert([{ email, token: newToken, attempts: 1 }]);

       if (insertError) throw insertError;

       token = newToken;
     }

     // ✉️ Send new user email
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
    <>
      {/* <Image
        src="/assets/HEX 2_1.png"
        alt="Top Left"
        width={1200}
        height={1200}
        className="hidden lg:flex absolute top-[-300px] left-[-300px] -z-10"
      />

      <Image
        src="/assets/HEX 1_1.png"
        alt="Bottom Right"
        width={1200}
        height={1200}
        className="hidden lg:flex absolute bottom-[-255px] right-[-300px] -z-10"
      /> */}
      <main className="grid grid-cols-1 lg:grid-cols-2 items-center justify-center w-full h-full py-20">
        <LeftColumn />
        <section className="hidden lg:flex">
          <div className="relative flex flex-col gap-8 p-12 w-[502px] min-h-[592px] mx-auto bg-white rounded-[24px] shadow-md text-gray-600">
            <div className="w-fit h-auto">
              <h1 className="text-[30px] font-bold">Register</h1>
              <div
                className="w-24 h-1 rounded"
                style={{
                  background:
                    "linear-gradient(to right, blue, green, yellow, red)",
                }}
              ></div>
            </div>

            {!sent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendEmail();
                }}
              >
                <p className="text-[14px] mb-8 italic">
                  Please enter a valid, active email (e.g., example@domain.com).
                  A confirmation link will be sent to it.
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
                  {error && (
                    <p className="text-[#ff0000] text-[10px]">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-6 py-3 px-4 rounded-[10px] text-white font-semibold transition duration-300 ${
                    loading
                      ? "bg-[#0060DC] cursor-not-allowed"
                      : "bg-[linear-gradient(to_right,_#0060DC,_#00E071)] hover:opacity-90 cursor-pointer"
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
              <div className="flex items-start text-[11px] text-gray-700">
                <label htmlFor="agree">
                  By continuing, I agree with the{" "}
                  <span
                    onClick={() => setModalContent("terms")}
                    role="button"
                    tabIndex={0}
                    className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
                  >
                    Terms & Conditions,
                  </span>{" "}
                  <br />
                  <span
                    onClick={() => setModalContent("privacy")}
                    role="button"
                    tabIndex={0}
                    className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
                  >
                    Privacy Policy
                  </span>
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
                        These Terms & Conditions govern your access to and use
                        of our services...
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
        </section>
      </main>
    </>
  );
}
