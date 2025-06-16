"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import emailjs from "@emailjs/browser";
import { v4 as uuidv4 } from "uuid";
import { IoMdArrowRoundForward, IoMdArrowRoundBack } from "react-icons/io";
import Image from "next/image";
import countryCodes from "../../public/data/all_country_codes.json";

export default function PersonalInfoForm() {
  const [step, setStep] = useState(3);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showValidationModal, setShowValidationModal] = useState(false);

  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "invalid">(
    "verifying"
  );

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setStatus("invalid");
        return;
      }

      const { data, error } = await supabase
        .from("sat_forum_email_verification")
        .select("*")
        .eq("email", decodeURIComponent(email))
        .eq("token", token)
        .single();

      if (error || !data) {
        setStatus("invalid");
      } else {
        // Optionally mark it verified
        await supabase
          .from("sat_forum_email_verification")
          .update({ verified: true })
          .eq("email", decodeURIComponent(email))
          .eq("token", token);

        setStatus("success");
      }
    };

    verifyToken();
  }, [token, email]);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    cellphone: "",
    countryCode: "+63",
    address: {
      street: "",
      barangay: "",
      city: "",
      province_state: "",
      zip: "",
    },
    company_organization: "",
    designation_jobtitle: "",
    participation_type: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (step === 3) {
      if (!formData.email.trim()) errors.email = "Email is required";
      if (!formData.firstName.trim())
        errors.firstName = "First name is required";
      if (!formData.lastName.trim()) errors.lastName = "Last name is required";
      if (!formData.cellphone.trim())
        errors.cellphone = "Phone number is required";
    }

    if (step === 4) {
      if (!formData.address?.barangay) {
        errors["address.barangay"] = "Barangay is required";
      }
      if (!formData.address?.city) {
        errors["address.city"] = "City is required";
      }
      if (!formData.address?.province_state) {
        errors["address.province_state"] = "Province is required";
      }
    }

    if (step === 5) {
      if (!formData.participation_type) {
        errors["participation_type"] = "Please select a participation type";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendEmail = async (email: string) => {
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      alert("Invalid email address.");
      return;
    }

    const token = uuidv4();
    const verificationUrl = `${window.location.origin}/verify?token=${token}`;

    const templateParams = {
      to_email: email,
      verification_url: verificationUrl,
      email: email,
    };

    try {
      setLoading(true);

      await emailjs.send(
        "service_1qkyi2i",
        "template_28r3rcr",
        templateParams,
        "sOTpCYbD5KllwgbCD"
      );
      localStorage.setItem(token, email);
      setSent(true);
      console.log("Verification email sent.");
    } catch (err) {
      console.error("Email send error:", err);
      alert("Failed to send verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const isValid = validateForm();
    if (!isValid) {
      setShowValidationModal(true);
      return;
    }

    try {
      // 🔍 Check if email already exists
      const { data: existingList, error: fetchError } = await supabase
        .from("sat_forum_registrations")
        .select("id")
        .eq("email", formData.email);

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError.message);
        alert("Error checking existing registration.");
        return;
      }

      if (existingList && existingList.length > 0) {
        setFormErrors((prev) => ({
          ...prev,
          email: "This email is already registered.",
        }));
        setStep(3);
        return;
      }

      // ✅ Proceed to insert
      const { data, error } = await supabase
        .from("sat_forum_registrations")
        .insert([
          {
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            cellphone: `${formData.countryCode}${formData.cellphone}`,
            street: formData.address.street,
            barangay: formData.address.barangay,
            city: formData.address.city,
            province_state: formData.address.province_state,
            zip: formData.address.zip,
            company: formData.company_organization,
            designation: formData.designation_jobtitle,
            participation: formData.participation_type,
          },
        ]);

      if (error) {
        console.error("Supabase insert error:", error.message);
        alert("Error submitting the form. Please try again.");
      } else {
        console.log("Saved data:", data);
        await handleSendEmail(formData.email);

        // Reset form
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          cellphone: "",
          countryCode: "+63",
          address: {
            street: "",
            barangay: "",
            city: "",
            province_state: "",
            zip: "",
          },
          company_organization: "",
          designation_jobtitle: "",
          participation_type: "",
        });
        setStep(3);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred.");
    }
  };

  const nextStep = () => {
    // Only validate on step 3, 4, or 5 depending on your logic
    if (step === 3 || step === 4 || step === 5) {
      const isValid = validateForm();
      if (!isValid) return; // prevent going to next step if invalid
    }

    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 3));

  return (
    <>
      {status === "verifying" && (
        <p className="text-blue-600 text-lg font-medium">Verifying token...</p>
      )}
      {status === "success" && (
        <main className="flex justify-center items-center w-screen min-h-screen p-2">
          <div className="flex flex-col gap-8 w-[502px] h-[592px] mx-auto bg-white rounded-[24px] shadow-md text-gray-600">
            {!sent ? (
              <>
                <div className="p-12">
                  <div className="w-full flex justify-between items-center">
                    <div className="flex gap-10">
                      <h2 className="text-[16px] font-semibold">
                        Personal Information
                      </h2>
                      <h2 className="text-[16px] font-semibold">
                        {step - 2} of 3
                      </h2>
                    </div>

                    <div className="flex items-center">
                      {step > 3 && (
                        <IoMdArrowRoundBack
                          onClick={prevStep}
                          className="cursor-pointer"
                        />
                      )}
                      {step < 5 && (
                        <IoMdArrowRoundForward
                          onClick={nextStep}
                          className="cursor-pointer ml-4"
                        />
                      )}
                    </div>
                  </div>
                  {step === 3 && (
                    <div className="grid gap-8 text-black">
                      <p className="text-[14px] italic">
                        Fill in your personal information.
                      </p>
                      <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-medium">
                          Email Address
                        </label>
                        <input
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`text-[14px] border ${
                            formErrors.email
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded px-4 py-2 w-full`}
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.email}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex flex-col gap-2 w-full">
                          <label className="text-[14px] font-medium">
                            First Name
                          </label>
                          <input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`text-[14px] border ${
                              formErrors.firstName
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded px-4 py-2 w-full`}
                            placeholder="First Name"
                          />
                          {formErrors.firstName && (
                            <span className="text-[12px] text-red-500">
                              First name is required.
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                          <label className="text-[14px] font-medium">
                            Last Name
                          </label>
                          <input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={`text-[14px] border ${
                              formErrors.lastName
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded px-4 py-2 w-full`}
                            placeholder="Last Name"
                          />
                          {formErrors.lastName && (
                            <span className="text-[12px] text-red-500">
                              Last name is required.
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-medium">
                          Phone Number
                        </label>
                        <div className="flex gap-2">
                          <select
                            name="countryCode"
                            value={formData.countryCode}
                            onChange={handleChange}
                            className="w-[50%] border border-gray-300 rounded px-4 py-2"
                          >
                            {countryCodes.map((country) => (
                              <option key={country.name} value={country.code}>
                                {country.flag} ({country.code})
                              </option>
                            ))}
                          </select>
                          <input
                            name="cellphone"
                            value={formData.cellphone}
                            onChange={handleChange}
                            className={`w-full border ${
                              formErrors.cellphone
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded px-4 py-2`}
                            placeholder="Enter number"
                          />
                        </div>
                        {formErrors.cellphone && (
                          <span className="text-[12px] text-red-500">
                            Phone number is required.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="grid gap-8 text-black">
                      {/* Street Address (Optional) */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-[14px] font-medium mb-1">
                          Street Address
                        </label>
                        <input
                          name="address.street"
                          value={formData.address?.street || ""}
                          onChange={handleChange}
                          placeholder="Street Address (Optional)"
                          className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Barangay */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-[14px] font-medium mb-1">
                          Barangay
                        </label>
                        <input
                          name="address.barangay"
                          value={formData.address?.barangay || ""}
                          onChange={handleChange}
                          placeholder="Barangay"
                          className={`text-[14px] border ${
                            formErrors["address.barangay"]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {formErrors["address.barangay"] && (
                          <span className="text-[12px] text-red-500">
                            Barangay is required.
                          </span>
                        )}
                      </div>

                      {/* City */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-[14px] font-medium mb-1">
                          City
                        </label>
                        <input
                          name="address.city"
                          value={formData.address?.city || ""}
                          onChange={handleChange}
                          placeholder="Municipality/City"
                          className={`text-[14px] border ${
                            formErrors["address.city"]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {formErrors["address.city"] && (
                          <span className="text-[12px] text-red-500">
                            City is required.
                          </span>
                        )}
                      </div>

                      {/* Province and ZIP */}
                      <div className="flex gap-2">
                        <div className="flex flex-col gap-2 w-full">
                          <label className="block text-[14px] font-medium mb-1">
                            Province / State
                          </label>
                          <input
                            name="address.province_state"
                            value={formData.address?.province_state || ""}
                            onChange={handleChange}
                            placeholder="Province"
                            className={`text-[14px] border ${
                              formErrors["address.province_state"]
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                          {formErrors["address.province_state"] && (
                            <span className="text-[12px] text-red-500">
                              Province is required.
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                          <label className="block text-[14px] font-medium mb-1">
                            Zip Code
                          </label>
                          <input
                            name="address.zip"
                            value={formData.address?.zip || ""}
                            onChange={handleChange}
                            placeholder="ZIP Code"
                            className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="grid gap-8 text-black">
                      {/* Company / Organization */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-[14px] font-medium mb-1">
                          Company / Organization Name
                        </label>
                        <input
                          name="company_organization"
                          value={formData.company_organization}
                          onChange={handleChange}
                          placeholder="Name of company / organization"
                          className={`text-[14px] border ${
                            formErrors.company_organization
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {formErrors.company_organization && (
                          <span className="text-[12px] text-red-500">
                            {formErrors.company_organization}
                          </span>
                        )}
                      </div>

                      {/* Designation */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-[14px] font-medium mb-1">
                          Designation / Job Title
                        </label>
                        <input
                          name="designation_jobtitle"
                          value={formData.designation_jobtitle}
                          onChange={handleChange}
                          placeholder="Job Title"
                          className={`text-[14px] border ${
                            formErrors.designation_jobtitle
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {formErrors.designation_jobtitle && (
                          <span className="text-[12px] text-red-500">
                            {formErrors.designation_jobtitle}
                          </span>
                        )}
                      </div>

                      {/* Participation Type */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-[14px] font-medium mb-1">
                          Select Your Participation Type
                        </label>
                        <div
                          className={`flex flex-col gap-2 text-[14px] p-2 rounded ${
                            formErrors.participation_type
                              ? "border border-red-500"
                              : ""
                          }`}
                        >
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="participation_type"
                              value="In-Person"
                              onChange={handleChange}
                              checked={
                                formData.participation_type === "In-Person"
                              }
                            />
                            In-Person
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="participation_type"
                              value="Online"
                              onChange={handleChange}
                              checked={formData.participation_type === "Online"}
                            />
                            Online
                          </label>
                        </div>
                        {formErrors.participation_type && (
                          <span className="text-[12px] text-red-500">
                            {formErrors.participation_type}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="w-full h-auto grid grid-rows-2">
                <div className="bg-[#EF498F]/14 flex flex-col items-center">
                  <Image
                    src="/assets/success.png"
                    alt="Email"
                    width={370}
                    height={370}
                  />
                </div>
                <div className="flex flex-col mt-12 px-12">
                  <p className="font-bold text-[24px]">
                    You are successfully registered! <br />
                    Check your Email to get you QR Code
                  </p>
                  <a
                    href="https://blinkcreativestudio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center items-center mt-6 bg-blue-600 text-white px-4 py-4 rounded hover:bg-blue-700 transition"
                  >
                    Go to website
                  </a>
                </div>
              </div>
            )}

            {step === 5 && !sent && (
              <div className="px-12">
                <button
                  onClick={handleSubmit}
                  className={`w-full mt-6 py-2 px-4 rounded text-white ${
                    loading
                      ? "bg-blue-400 cursor-progress"
                      : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  }`}
                >
                  {loading ? "Submitting....." : "Submit"}
                </button>
              </div>
            )}

            {showValidationModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
                  <h2 className="text-lg font-semibold mb-4 text-red-600">
                    Missing Required Fields
                  </h2>
                  <p className="text-sm text-gray-700 mb-6">
                    Please complete all required fields before submitting the
                    form.
                  </p>
                  <div className="flex justify-end">
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                      onClick={() => setShowValidationModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
      {status === "invalid" && (
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid or Expired Link</h2>
          <p>Please check the verification link or try registering again.</p>
        </div>
      )}
    </>
  );
}
