"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient"; // Adjust path if needed
import TermsCondition from "./TermsCondition";
import PrivacyPolicy from "./PrivacyPolicy";
import { v4 as uuidv4 } from "uuid";

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
      let isAlreadyRegistered = false;
      let token: string;

      // 🔍 Check if already registered in satf_participant_online_17
      const { data: existingOnline } = await supabase
        .from("satf_participant_online_17")
        .select("email")
        .ilike("email", email)
        .maybeSingle();

      if (existingOnline) {
        isAlreadyRegistered = true;
      }

      // 🔑 Token logic
      const { data: existingToken } = await supabase
        .from("satf_verification_17")
        .select("*")
        .ilike("email", email)
        .maybeSingle();

      if (existingToken) {
        await supabase
          .from("satf_verification_17")
          .update({ attempts: (existingToken.attempts ?? 0) + 1 })
          .ilike("email", email);

        token = existingToken.token;
      } else {
        const newToken = uuidv4(); // ✅ FIXED
        const { error: insertError } = await supabase
          .from("satf_verification_17")
          .insert([{ email, token: newToken, attempts: 1 }]);

        if (insertError) throw insertError;

        token = newToken;
      }

      // ✉️ Send appropriate email
      const verificationUrl = `${
        window.location.origin
      }/registration/online/17-july?token=${token}&email=${encodeURIComponent(
        email
      )}`;

      await emailjs.send(
        "service_1qkyi2i",
        isAlreadyRegistered ? "template_4pa1s5i" : "template_fwozquc",
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
      <section className="flex flex-col justify-center items-center px-4 lg:px-8 max-w-[695px] w-full">
        <div className="w-full flex flex-col gap-12">
          <div className="flex flex-col justify-center items-center text-center lg:justify-start lg:items-start lg:text-start gap-8">
            <Image
              src="/assets/SATF_Logo.png"
              alt="Bottom Right"
              width={507}
              height={69}
              className="w-full max-w-[507px] h-auto"
            />
            <p className="text-[18px] leading-[23px]">
              SATF is a forward-looking forum on breakthrough tech in animal
              production—delivering expert insights that drive real-world gains.
            </p>
          </div>
          <section className="flex lg:hidden px-4 lg:px-10">
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
                    Please enter a valid and active email address (e.g.,
                    example@domain.com). A confirmation link and Zoom access
                    details will be sent to this email.
                    <br />
                    <br />
                    <span className="text-red-600">
                      Note: This is **online registration only** as onsite slots
                      are already full.
                    </span>
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
              <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
                <div className="bg-white max-w-[90%] w-full rounded-tr-lg rounded-tl-lg shadow-lg p-6 relative">
                  {/* <h2 className="text-3xl font-bold mb-4 text-gray-800">
                            {modalContent === "terms"
                              ? "Terms & Conditions"
                              : "Privacy Policy"}
                          </h2> */}
                  <div className="text-sm max-h-[400px] overflow-y-auto space-y-2 text-gray-700">
                    {modalContent === "terms" ? (
                      <>
                        <TermsCondition />
                      </>
                    ) : (
                      <>
                        <PrivacyPolicy />
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setModalContent(null)}
                    className="absolute top-1 right-3 text-gray-500 hover:text-black text-lg cursor-pointer"
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
            <div className="flex flex-col gap-y-8 lg:flex-row gap-x-4 lg:gap-x-16 justify-center items-center lg:justify-start lg:items-start">
              <div className="flex flex-col gap-y-8 w-fit">
                <p className="text-[12px] lg:text-[16px] leading-[23px]">
                  In partnership with
                </p>
                <div className="flex flex-wrap gap-8 justify-center items-center">
                  <Image
                    src="/assets/collaborations/Big_Dutchman_Logo.svg 1.png"
                    alt="Big Dutchman"
                    width={108}
                    height={36}
                    className="w-[100px] h-auto lg:w-[108px] lg:h-auto"
                  />
                  <Image
                    src="/assets/collaborations/BI_LOGO_NEONGREEN 1.png"
                    alt="BI Logo"
                    width={80}
                    height={24}
                    className="w-[74px] h-auto lg:w-[80px] lg:h-auto"
                  />
                  <Image
                    src="/assets/partners/DSM_FIRMENICH_WHITE_2 1.png"
                    alt="DSM Logo"
                    width={52}
                    height={30}
                    className="w-[48px] h-auto lg:w-[52px] lg:h-auto"
                  />
                  <Image
                    src="/assets/collaborations/LOHMANN_Orange&White.png"
                    alt="Lohmann Logo"
                    width={152}
                    height={53}
                    className="w-[75px] h-auto lg:w-[82px] lg:h-auto"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-y-8 w-fit justify-center items-center">
                <p className="text-[12px] lg:text-[16px] leading-[23px]">
                  Powered by
                </p>
                <div className="flex gap-x-8 justify-center items-center">
                  <Image
                    src="/assets/partners/BCS_LOGO_ALT_WHITE 1.png"
                    alt="Bottom Right"
                    width={69}
                    height={35}
                    className="w-[60px] h-auto lg:w-[69] lg:h-[35px]"
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
            <div className="flex flex-col gap-y-8 lg:flex-row gap-x-4 lg:gap-x-[100px] justify-center items-center lg:justify-start lg:items-start">
              <div className="flex flex-col gap-y-8 w-fit">
                <p className="text-[12px] lg:text-[16px] leading-[23px]">
                  In partnership with
                </p>
                <div className="flex flex-wrap gap-8 justify-center items-center">
                  <Image
                    src="/assets/collaborations/Big_Dutchman_Logo.svg 1.png"
                    alt="Big Dutchman"
                    width={108}
                    height={36}
                    className="w-[100px] h-auto lg:w-[108px] lg:h-auto"
                  />
                  <Image
                    src="/assets/collaborations/BI_LOGO_NEONGREEN 1.png"
                    alt="BI Logo"
                    width={80}
                    height={24}
                    className="w-[74px] h-auto lg:w-[80px] lg:h-auto"
                  />
                  <Image
                    src="/assets/partners/DSM_FIRMENICH_WHITE_2 1.png"
                    alt="DSM Logo"
                    width={52}
                    height={30}
                    className="w-[48px] h-auto lg:w-[52px] lg:h-auto"
                  />
                  <Image
                    src="/assets/collaborations/cropped-cropped-pic_logo2 2.png"
                    alt="Lohmann Logo"
                    width={30}
                    height={35}
                    className="w-[27px] h-auto lg:w-[30px] lg:h-auto"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-y-8 w-fit justify-center items-center ml-4">
                <p className="text-[12px] lg:text-[16px] leading-[23px]">
                  Powered by
                </p>
                <div className="flex gap-x-8 justify-center items-center">
                  <Image
                    src="/assets/partners/BCS_LOGO_ALT_WHITE 1.png"
                    alt="Bottom Right"
                    width={69}
                    height={35}
                    className="w-[60px] h-auto lg:w-[69] lg:h-[35px]"
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
