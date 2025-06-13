"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import emailjs from "@emailjs/browser";
import { v4 as uuidv4 } from "uuid";
import { IoMdArrowRoundForward, IoMdArrowRoundBack } from "react-icons/io";
import Image from "next/image";

export default function PersonalInfoForm() {
  const [step, setStep] = useState(3);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: boolean }>({});
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
    const errors: { [key: string]: boolean } = {};

    if (!formData.email.trim()) errors.email = true;
    if (!formData.firstName.trim()) errors.firstName = true;
    if (!formData.lastName.trim()) errors.lastName = true;
    if (!formData.cellphone.trim()) errors.cellphone = true;
    if (!formData.address.barangay.trim()) errors.barangay = true;
    if (!formData.address.city.trim()) errors.city = true;
    if (!formData.address.province_state.trim()) errors.province_state = true;
    if (!formData.participation_type) errors.participation_type = true;

    setFormErrors(errors); // ❗ Set the error state

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
    try {
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
        console.error("Supabase error:", error.message);
        alert("Error submitting the form. Please try again.");
      } else {
        console.log("Saved data:", data);
        await handleSendEmail(formData.email);

        alert("Registration submitted and email sent!");
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

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 3));

  return (
    <main className="flex justify-center items-center w-screen min-h-screen p-2">
      <div className="flex flex-col gap-8 p-12 w-[502px] min-h-[592px] mx-auto bg-white rounded-[24px] shadow-md text-gray-600">
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-10">
            <h2 className="text-[16px] font-semibold">Personal Information</h2>
            <h2 className="text-[16px] font-semibold">{step - 2} of 3</h2>
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

        {!sent ? (
          <>
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
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                    required
                  />
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
                      className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full"
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-[14px] font-medium">Last Name</label>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full"
                      placeholder="Last Name"
                      required
                    />
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
                      className="w-[40%] border border-gray-300 rounded px-4 py-2"
                    >
                      <option value="+63">🇵🇭 +63</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>
                    <input
                      name="cellphone"
                      value={formData.cellphone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-4 py-2"
                      placeholder="Enter number"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-8 text-black">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="block text-[14px] font-medium mb-1"
                  >
                    Street Address
                  </label>
                  <input
                    name="address.street"
                    onChange={handleChange}
                    placeholder="Street Address (Optional)"
                    className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="block text-[14px] font-medium mb-1"
                  >
                    Barangay
                  </label>
                  <input
                    name="address.barangay"
                    onChange={handleChange}
                    placeholder="Barangay"
                    className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="block text-[14px] font-medium mb-1"
                  >
                    City
                  </label>
                  <input
                    name="address.city"
                    onChange={handleChange}
                    placeholder="Municipality/City"
                    className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="email"
                      className="block text-[14px] font-medium mb-1"
                    >
                      Province / State
                    </label>
                    <input
                      name="address.province_state"
                      onChange={handleChange}
                      placeholder="Province"
                      className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="email"
                      className="block text-[14px] font-medium mb-1"
                    >
                      Zip Code
                    </label>
                    <input
                      name="address.zip"
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
                <div className="flex flex-col gap-2">
                  <label className="block text-[14px] font-medium mb-1">
                    Company / Organization Name
                  </label>
                  <input
                    name="company_organization" // ✅ fixed
                    value={formData.company_organization}
                    onChange={handleChange}
                    placeholder="Name of company / organization"
                    className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block text-[14px] font-medium mb-1">
                    Designation / Job Title
                  </label>
                  <input
                    name="designation_jobtitle"
                    value={formData.designation_jobtitle}
                    onChange={handleChange}
                    placeholder="Job Title"
                    className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block text-[14px] font-medium mb-1">
                    Select Your Participation Type
                  </label>
                  <div className="flex flex-col gap-2 text-[14px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="participation_type" // ✅ fixed
                        value="In-Person"
                        onChange={handleChange}
                        checked={formData.participation_type === "In-Person"}
                      />
                      In-Person
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="participation_type" // ✅ fixed
                        value="Online"
                        onChange={handleChange}
                        checked={formData.participation_type === "Online"}
                      />
                      Online
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center flex flex-col items-center">
            <p className="italic text-[14px]">Check your email to verify.</p>
            <Image
              src="/assets/paper_airplane_send_with_dotted_lines_flat_style.jpg"
              alt="Email"
              width={300}
              height={300}
            />
          </div>
        )}

        {step === 5 && !sent && (
          <button
            onClick={handleSubmit}
            className={`w-full mt-6 py-2 px-4 rounded text-white ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Submitting....." : "Submit"}
          </button>
        )}
      </div>
    </main>
  );
}
