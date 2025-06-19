"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import emailjs from "@emailjs/browser";
import { v4 as uuidv4 } from "uuid";
import { IoMdArrowRoundForward, IoMdArrowRoundBack } from "react-icons/io";
import Image from "next/image";
import countryCodes from "../../public/data/all_country_codes.json";
import LeftColumn2 from "../components/LeftComun2";

export default function PersonalInfoForm() {
  const [step, setStep] = useState(3);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Start Event date selection
  // const [selectedEvents, setSelectedEvents] = useState([]);

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      const updatedEvents = checked
        ? [...prev.selectedEvents, value]
        : prev.selectedEvents.filter((event) => event !== value);

      return {
        ...prev,
        selectedEvents: updatedEvents,
      };
    });
  };

  const renderSelectedText = () => {
    if (!formData.selectedEvents || formData.selectedEvents.length === 0) {
      return "⚠️ Please select at least one event.";
    }

    if (formData.selectedEvents.length === 1) {
      return formData.selectedEvents[0] === "event1"
        ? "July 17, 2025 | Future Laid: Innovation Beyond the Shell"
        : "July 24, 2025 | Beyond the Pen: Reimagining Swine Through Innovation";
    }

    if (formData.selectedEvents.length === 2) {
      return `You have selected both events:\n• July 17, 2025 | Future Laid: Innovation Beyond the Shell\n• July 24, 2025 | Beyond the Pen: Reimagining Swine Through Innovation`;
    }

    return ""; // fallback
  };

  // End Event date selection

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

        // ✅ Set the email to formData
        setFormData((prev) => ({
          ...prev,
          email: decodeURIComponent(email),
        }));

        setStatus("success");
      }
    };

    verifyToken();
  }, [token, email]);

  const [formData, setFormData] = useState<{
    selectedEvents: string[]; // ✅ Add this
    email: string;
    firstName: string;
    lastName: string;
    cellphone: string;
    countryCode: string;
    address: {
      street: string;
      barangay: string;
      city: string;
      province_state: string;
      zip: string;
    };
    company_organization: string;
    designation_jobtitle: string;
    participation_type: string;
  }>({
    selectedEvents: [], // ✅ Initial value
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
      console.log("Field changed:", name, value); // <-- Add this
      const cleanValue =
        name === "cellphone" ? value.replace(/\D/g, "") : value;
      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (step === 3) {
      if (!formData.selectedEvents || formData.selectedEvents.length === 0) {
        errors["selectedEvents"] = "Please select at least one event.";
      }
    }

    if (step === 4) {
      if (!formData.email.trim()) errors.email = "Email is required";
      if (!formData.firstName.trim())
        errors.firstName = "First name is required";
      if (!formData.lastName.trim()) errors.lastName = "Last name is required";
      if (!formData.cellphone.trim())
        errors.cellphone = "Phone number is required";
    }

    if (step === 5) {
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

    if (step === 6) {
      if (!formData.participation_type) {
        errors["participation_type"] = "Please select a participation type";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateQRCode = async (email: string): Promise<string | null> => {
    try {
      const response = await fetch("https://api.me-qr.com/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "x-api-key":
            "f4910ec48a1f1481b4bd5ea250fa899da010cd2611dd5c2fdbf7f24ecfac541e", // Replace with your key
        },
        body: JSON.stringify({
          data: `https://sat-forum-registration.vercel.app/qr-download?email=${email}`,
          frame_name: "no-frame",
          size: 500,
        }),
      });

      const result = await response.json();
      return result?.data?.full_url || null;
    } catch (error) {
      console.error("QR code generation failed:", error);
      return null;
    }
  };

  const handleSendEmail = async (email: string) => {
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      alert("Invalid email address.");
      return;
    }

    const token = uuidv4();
    const verificationUrl = `${window.location.origin}/verify?token=${token}`;

    // 👇 Generate QR code from Me-QR
    const qrCodeUrl = await generateQRCode(email);

    const templateParams = {
      to_email: email,
      verification_url: verificationUrl,
      email: email,
      qr_code_url: qrCodeUrl,
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
        setStep(4);
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
            selected_events: formData.selectedEvents, // ← this line is new
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
          selectedEvents: [],
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
    // Only validate on step 3, 4, 5, or 6
    if (step === 3 || step === 4 || step === 5 || step === 6) {
      const isValid = validateForm();
      if (!isValid) return; // prevent going to next step if invalid
    }

    // Allow progressing up to step 6 (final step)
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 3));

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
      {status === "verifying" && (
        <div className="max-w-full min-h-screen flex justify-center items-center">
          {/* <p className="text-blue-600 text-lg font-medium">
            Verifying token...
          </p> */}
          <div className="loader"></div>
        </div>
      )}
      {status === "success" && (
        <main className="grid grid-cols-1 lg:grid-cols-2 items-center justify-center w-full h-full py-20">
          <LeftColumn2 />

          {/* ------------------------------------------------------------------------------------- */}

          <section className="hidden lg:flex">
            <div className="flex flex-col gap-8 w-[502px] h-[592px] mx-auto bg-white rounded-[24px] shadow-md text-gray-600 relative">
              {!sent ? (
                <>
                  <div className="p-12">
                    {step === 3 && (
                      <div className="grid gap-6 text-black">
                        <div className="w-fit h-auto">
                          <h1 className="text-[30px] font-bold">
                            Event Selection
                          </h1>
                          <div
                            className="w-24 h-1 rounded"
                            style={{
                              background:
                                "linear-gradient(to right, blue, green, yellow, red)",
                            }}
                          ></div>
                        </div>
                        <p className="text-[18px] font-bold">
                          Please select the event you’d like to attend:
                        </p>
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-8">
                            <div className="flex flex-col justify-start items-center gap-6">
                              <div
                                className={`w-[84px] h-[84px] rounded-full flex items-center justify-center ${
                                  formData.selectedEvents?.includes("event1")
                                    ? "bg-[#007AFF]"
                                    : "bg-[#E5E3DE]"
                                }`}
                              >
                                <Image
                                  src={
                                    formData.selectedEvents?.includes("event1")
                                      ? "/assets/event_date_selection/pig_highlight.png"
                                      : "/assets/event_date_selection/pig_dark.png"
                                  }
                                  alt="Pig Icon"
                                  width={59}
                                  height={59}
                                  className="w-[59px] h-[59px]"
                                />
                              </div>
                              <div className="flex gap-4">
                                <input
                                  type="checkbox"
                                  id="event1"
                                  value="event1"
                                  checked={formData.selectedEvents?.includes(
                                    "event1"
                                  )}
                                  onChange={handleCheck}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label
                                  htmlFor="event1"
                                  className="text-[14px] text-gray-700"
                                >
                                  July 17, 2025 | Future Laid: Innovation Beyond
                                  the Shell
                                </label>
                              </div>
                            </div>

                            <div className="flex flex-col justify-start items-center gap-6">
                              <div
                                className={`w-[84px] h-[84px] rounded-full flex items-center justify-center ${
                                  formData.selectedEvents?.includes("event2")
                                    ? "bg-[#007AFF]"
                                    : "bg-[#E5E3DE]"
                                }`}
                              >
                                <Image
                                  src={
                                    formData.selectedEvents?.includes("event2")
                                      ? "/assets/event_date_selection/egg_highlight.png"
                                      : "/assets/event_date_selection/egg_dark.png"
                                  }
                                  alt="Egg Icon"
                                  width={59}
                                  height={59}
                                  className="w-[59px] h-[59px]"
                                />
                              </div>
                              <div className="flex gap-4">
                                <input
                                  type="checkbox"
                                  id="event2"
                                  value="event2"
                                  checked={formData.selectedEvents?.includes(
                                    "event2"
                                  )}
                                  onChange={handleCheck}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label
                                  htmlFor="event2"
                                  className="text-[14px] text-gray-700"
                                >
                                  July 24, 2025 | Beyond the Pen: Reimagining
                                  Swine Through Innovation
                                </label>
                              </div>
                            </div>
                          </div>

                          <p
                            className={`text-[14px] italic mt-4 whitespace-pre-line font-medium ${
                              !formData.selectedEvents ||
                              formData.selectedEvents.length === 0
                                ? "text-red-500"
                                : "text-[#787878]"
                            }`}
                          >
                            {renderSelectedText()}
                          </p>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="grid gap-6 text-black">
                        <div className="w-fit h-auto">
                          <h1 className="text-[30px] font-bold">
                            Personal Information
                          </h1>
                          <div
                            className="w-24 h-1 rounded"
                            style={{
                              background:
                                "linear-gradient(to right, blue, green, yellow, red)",
                            }}
                          ></div>
                        </div>
                        <p className="text-[14px] italic">
                          Fill in your personal information.
                        </p>
                        <div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium">
                              Email Address
                            </label>
                            <input
                              name="email"
                              value={formData.email}
                              readOnly // ✅ prevents user editing
                              onChange={handleChange}
                              placeholder="email@example.com"
                              className={`text-[14px] border ${
                                formErrors.email
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } rounded px-4 py-2 w-full`}
                            />
                            <span
                              className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                                formErrors.email ? "opacity-100" : "opacity-0"
                              }`}
                            >
                              {formErrors.email || "Placeholder"}
                            </span>
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
                                } rounded px-4 py-2 w-full uppercase`}
                                placeholder="First Name"
                              />
                              <span
                                className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                                  formErrors.firstName
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              >
                                {formErrors.firstName || "Placeholder"}
                              </span>
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
                                } rounded px-4 py-2 w-full uppercase`}
                                placeholder="Last Name"
                              />
                              <span
                                className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                                  formErrors.lastName
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              >
                                {formErrors.lastName || "Placeholder"}
                              </span>
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
                                  <option
                                    key={country.name}
                                    value={country.code}
                                  >
                                    {country.flag} ({country.code})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="tel"
                                name="cellphone"
                                value={formData.cellphone}
                                onChange={handleChange}
                                className={`w-full border ${
                                  formErrors.cellphone
                                    ? "border-red-500"
                                    : "border-gray-300"
                                } rounded px-4 py-2 uppercase`}
                                placeholder="Enter number"
                              />
                            </div>
                            <span
                              className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                                formErrors.cellphone
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              {formErrors.cellphone || "Placeholder"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 5 && (
                      <div className="grid gap-2 text-black">
                        {/* Street Address (Optional) */}
                        <div className="flex flex-col gap-2 pb-6">
                          <label className="block text-[14px] font-medium mb-1">
                            Street Address{" "}
                            <span className="text-gray-500">(Optional)</span>
                          </label>
                          <input
                            name="address.street"
                            value={formData.address?.street || ""}
                            onChange={handleChange}
                            placeholder="e.g. 245 JP Rizal St."
                            className="uppercase text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            placeholder="e.g. Barangay Sto. Niño"
                            className={`text-[14px] border ${
                              formErrors["address.barangay"]
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase`}
                          />
                          <span
                            className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                              formErrors["address.barangay"]
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            {formErrors["address.barangay"] || "Placeholder"}
                          </span>
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
                            placeholder="e.g. Marikina City"
                            className={`text-[14px] border ${
                              formErrors["address.city"]
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase`}
                          />
                          <span
                            className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                              formErrors["address.city"]
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            {formErrors["address.city"] || "Placeholder"}
                          </span>
                        </div>

                        {/* Province and ZIP */}
                        <div className="flex gap-2">
                          {/* Province */}
                          <div className="flex flex-col gap-2 w-full">
                            <label className="block text-[14px] font-medium mb-1">
                              Province / State
                            </label>
                            <input
                              name="address.province_state"
                              value={formData.address?.province_state || ""}
                              onChange={handleChange}
                              placeholder="e.g. Metro Manila"
                              className={`text-[14px] border ${
                                formErrors["address.province_state"]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase`}
                            />
                            <span
                              className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                                formErrors["address.province_state"]
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              {formErrors["address.province_state"] ||
                                "Placeholder"}
                            </span>
                          </div>

                          {/* Zip Code */}
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

                    {step === 6 && (
                      <div className="grid gap-2 text-black">
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
                            } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase`}
                          />
                          <span
                            className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                              formErrors.company_organization
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            {formErrors.company_organization || "Placeholder"}
                          </span>
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
                            } rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase`}
                          />
                          <span
                            className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                              formErrors.designation_jobtitle
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            {formErrors.designation_jobtitle || "Placeholder"}
                          </span>
                        </div>

                        {/* Participation Type */}
                        <div className="flex flex-col gap-2">
                          <label className="block text-[14px] font-medium mb-1">
                            Select Your Participation Type
                          </label>
                          <div
                            className={`flex flex-col gap-2 text-[14px] rounded ${
                              formErrors.participation_type
                                ? "border border-red-500"
                                : ""
                            }`}
                          >
                            <label
                              className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all duration-150 ${
                                formData.participation_type === "In-Person"
                                  ? "bg-blue-100 border-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="participation_type"
                                value="In-Person"
                                onChange={handleChange}
                                checked={
                                  formData.participation_type === "In-Person"
                                }
                                className="hidden"
                              />
                              In-Person
                            </label>

                            <label
                              className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${
                                formData.participation_type === "Online"
                                  ? "bg-blue-100 border-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="participation_type"
                                value="Online"
                                onChange={handleChange}
                                checked={
                                  formData.participation_type === "Online"
                                }
                                className="hidden"
                              />
                              Online
                            </label>
                          </div>
                          <span
                            className={`text-[12px] text-red-500 transition-opacity duration-200 ${
                              formErrors.participation_type
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            {formErrors.participation_type || "Placeholder"}
                          </span>
                        </div>
                      </div>
                    )}
                    {step === 6 && !sent && (
                      <div className="">
                        <button
                          onClick={handleSubmit}
                          className={`w-full mt-4 py-3 px-4 rounded-[10px] text-white ${
                            loading
                              ? "bg-[#0060DC] cursor-not-allowed"
                              : "bg-[linear-gradient(to_right,_#0060DC,_#00E071)] hover:opacity-90 cursor-pointer"
                          }`}
                        >
                          {loading ? "Submitting..." : "Register"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fixed Bottom Navigation */}
                  <div className="absolute bottom-0 left-0 w-full px-12 py-6">
                    <div className="w-full flex flex-col items-center gap-4">
                      <div className="flex items-center gap-4">
                        {step > 3 && (
                          <div
                            className="cursor-pointer w-[56px] h-[56px] flex justify-center items-center border border-[#006AD4] rounded-full"
                            onClick={prevStep}
                          >
                            <IoMdArrowRoundBack className="text-[#006AD4] w-6 h-6" />
                          </div>
                        )}
                        {step < 6 && (
                          <div
                            className="cursor-pointer w-[56px] h-[56px] flex justify-center items-center border border-[#006AD4] rounded-full"
                            onClick={nextStep}
                          >
                            <IoMdArrowRoundForward className="text-[#006AD4] w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${
                              step - 2 === i ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full h-auto grid grid-rows-2">
                    <div className="flex flex-col items-center mt-12">
                      <Image
                        src="/assets/successfull.png"
                        alt="successfull"
                        width={320}
                        height={320}
                      />
                    </div>
                    <div className="flex flex-col justify-center items-center mt-12 px-12">
                      <p className="text-[25px] font-bold leading-[24px]">
                        You are successfully registered!{" "}
                      </p>
                      <p className="text-[18px] leading-[24px]">
                        Check your Email to get you QR Code
                      </p>

                      <a
                        href="https://blinkcreativestudio.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex justify-center items-center mt-6 text-white px-4 py-4 rounded bg-[linear-gradient(to_right,_#0060DC,_#00E071)] hover:opacity-90 cursor-pointer"
                      >
                        Go to website
                      </a>
                    </div>
                  </div>
                </>
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
          </section>

          {/* ------------------------------------------------------------------------------------- */}
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
