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
      <section className="flex flex-col justify-center items-center px-4 lg:px-20">
        <div className="w-full flex flex-col gap-12">
          <div className="flex flex-col gap-8">
            <Image
              src="/assets/SATF_Logo.png"
              alt="Bottom Right"
              width={507}
              height={69}
              className="w-[330px] h-[45px] lg:w-[507px] lg:h-[69px]"
            />
            <p className="text-[18px] leading-[23px]">
              SATF is a forward-looking forum on breakthrough tech in animal
              production—delivering expert insights that drive real-world gains.
            </p>
          </div>
          <section className="flex lg:hidden">
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
                    Please enter a valid, active email (e.g.,
                    example@domain.com). A confirmation link will be sent to it.
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
                    className={`w-full mt-6 py-3 px-4 rounded-[8px] text-white font-semibold transition duration-300 ${
                      loading
                        ? "bg-[#0060DC] cursor-not-allowed"
                        : "bg-[linear-gradient(to_right,_#0060DC,_#00E071)] hover:opacity-90"
                    }`}
                  >
                    {loading ? "Sending..." : "Send Verification Email"}
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex flex-col justify-center items-center py-12">
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
          <div className="w-full flex flex-col gap-8 text-center lg:text-start">
            <div className="flex flex-col justify-center items-center lg:justify-start lg:items-start gap-4">
              <h4 className="text-[14px] lg:text-[20px] leading-[24px] tracking-[10px]">
                JULY 17, 2025
              </h4>
              <h4
                className="text-[14px] lg:text-[20px] lg:leading-[23px]"
                style={{ fontWeight: 700 }}
              >
                Eggsponential Progress: Shaping the Future of Layer Production
                with Confidence
              </h4>
              <div
                className="w-20 md:w-40 h-0.5 lg:h-1 rounded"
                style={{
                  background:
                    "linear-gradient(to right, blue, green, yellow, red)",
                }}
              ></div>
            </div>
            <div className="flex justify-between md:justify-center md:gap-8 lg:grid lg:gap-0 lg:grid-cols-[30%_70%]">
              <div className="flex flex-col gap-4">
                <p className="text-[12px] lg:text-[16px] leading-[23px]">
                  In partnership with
                </p>
                <div className="flex justify-center items-center lg:justify-start lg:items-end gap-6">
                  <Image
                    src="/assets/partners/BCS_LOGO_ALT_WHITE 1.png"
                    alt="Bottom Right"
                    width={69}
                    height={35}
                    className="w-[50px] h-[26px] lg:w-[69] lg:h-[35px]"
                  />
                  <Image
                    src="/assets/partners/DSM_FIRMENICH_WHITE_2 1.png"
                    alt="Bottom Right"
                    width={52}
                    height={30}
                    className="w-[38px] h-[22px] lg:w-[52px] lg:h-[30px]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4 lg:text-center">
                <p className="text-[12px] lg:text-[16px] leading-[23px]">
                  In collaboration with
                </p>
                <div className="flex lg:flex-wrap justify-center items-center gap-6">
                  <Image
                    src="/assets/collaborations/logo-lohmann-white 1.png"
                    alt="Bottom Right"
                    width={43}
                    height={48}
                    className="w-[32px] h-[35px] lg:w-[43px] lg:h-[48px]"
                  />
                  <Image
                    src="/assets/collaborations/BI_LOGO_NEONGREEN 1.png"
                    alt="BI Logo"
                    width={80}
                    height={24}
                    className="w-[59px] h-[17px] lg:w-[80px] lg:h-[24px]"
                  />

                  <Image
                    src="/assets/collaborations/Big_Dutchman_Logo.svg 1.png"
                    alt="Bottom Right"
                    width={108}
                    height={36}
                    className="w-[80px] h-[26px] lg:w-[108px] lg:h-[36px]"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-8 text-center lg:text-start">
            <div className="flex flex-col justify-center items-center lg:justify-start lg:items-start gap-4">
              <h4 className="text-[14px] lg:text-[20px] leading-[24px] tracking-[10px]">
                JULY 24, 2025
              </h4>
              <h4
                className="text-[14px] lg:text-[20px] lg:leading-[23px]"
                style={{ fontWeight: 700 }}
              >
                Pork Forward:  Trailblazing the Path to Advanced Swine
                Production
              </h4>
              <div
                className="w-20 md:w-40 h-0.5 lg:h-1 rounded"
                style={{
                  background:
                    "linear-gradient(to right, blue, green, yellow, red)",
                }}
              ></div>
            </div>
            <div className="flex justify-between md:justify-center md:gap-8 lg:grid lg:gap-0 lg:grid-cols-[30%_70%]">
              <div className="flex flex-col gap-4">
                <p className="text-[12px] lg:text-[16px] leading-[23px]">
                  In partnership with
                </p>
                <div className="flex justify-center items-center lg:justify-start lg:items-end gap-6">
                  <Image
                    src="/assets/partners/BCS_LOGO_ALT_WHITE 1.png"
                    alt="Bottom Right"
                    width={69}
                    height={35}
                    className="w-[50px] h-[26px] lg:w-[69] lg:h-[35px]"
                  />
                  <Image
                    src="/assets/partners/DSM_FIRMENICH_WHITE_2 1.png"
                    alt="Bottom Right"
                    width={52}
                    height={30}
                    className="w-[38px] h-[22px] lg:w-[52px] lg:h-[30px]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4 lg:text-center">
                <p className="text-[12px] lg:text-[16px] leading-[23px]">
                  In collaboration with
                </p>
                <div className="flex flex-wrap justify-center items-center gap-6">
                  <Image
                    src="/assets/collaborations/cropped-cropped-pic_logo2 2.png"
                    alt="Bottom Right"
                    width={30}
                    height={43}
                    className="w-[24px] h-[35px] lg:w-[30px] lg:h-[43px]"
                  />
                  <Image
                    src="/assets/collaborations/BI_LOGO_NEONGREEN 1.png"
                    alt="BI Logo"
                    width={80}
                    height={24}
                    className="w-[59px] h-[17px] lg:w-[80px] lg:h-[24px]"
                  />

                  <Image
                    src="/assets/collaborations/Big_Dutchman_Logo.svg 1.png"
                    alt="Bottom Right"
                    width={108}
                    height={36}
                    className="w-[80px] h-[26px] lg:w-[108px] lg:h-[36px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
