"use client";

import { useState } from "react";
import { IoMdArrowRoundForward, IoMdArrowRoundBack } from "react-icons/io";

export default function PersonalInfoForm() {
  const [step, setStep] = useState(3);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    // middleName: "",
    lastName: "",
    cellphone: "",
    address: {
      street: "",
      barangay: "",
      city: "",
      province_state: "",
      zip: "",
    },
    clinic_hospital: "",
    prc_number: "",
    prc_exp: "",
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

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <main className="flex justify-center items-center w-screen min-h-screen p-2">
      <div className="flex flex-col gap-8 p-12 w-[502px] min-h-[592px] mx-auto bg-white rounded-[24px] shadow-md text-gray-600">
        <div className="flex gap-6 justify-start items-baseline">
          <div className="flex gap-10">
            <h2 className="text-[16px] font-semibold">Personal Information</h2>
            <h2 className="text-[16px] font-semibold">1 of 3</h2>
          </div>
          <div className="mx-auto flex justify-between">
            {step > 3 && <IoMdArrowRoundBack onClick={prevStep} />}
            {step < 5 ? (
              <IoMdArrowRoundForward onClick={nextStep} />
            ) : (
              <button
                onClick={() => alert("Submit Form")}
                className="btn bg-green-500 text-white"
              >
                Submit
              </button>
            )}
          </div>
        </div>
        <p className="text-[14px] italic">Fill in your personal information.</p>

        {step === 3 && (
          <div className="grid gap-6 text-black">
            <label
              htmlFor="email"
              className="block text-[14px] font-medium mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              onChange={handleChange}
              className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
            <div className="flex gap-2">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[14px] font-medium mb-1"
                >
                  First Name
                </label>
                <input
                  name="firstName"
                  onChange={handleChange}
                  className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="First Name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-[14px] font-medium mb-1"
                >
                  Last Name
                </label>
                <input
                  name="lastName"
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <label
              htmlFor="email"
              className="block text-[14px] font-medium mb-1"
            >
              Phone Number
            </label>
            <input
              name="cellphone"
              onChange={handleChange}
              placeholder="Cellphone Number"
              className="text-[14px] border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4">
            <input
              name="address.street"
              onChange={handleChange}
              placeholder="Street"
              className="input"
            />
            <input
              name="address.barangay"
              onChange={handleChange}
              placeholder="Barangay"
              className="input"
            />
            <input
              name="address.city"
              onChange={handleChange}
              placeholder="Municipality/City"
              className="input"
            />
            <input
              name="address.province_state"
              onChange={handleChange}
              placeholder="Province"
              className="input"
            />
            <input
              name="address.zip"
              onChange={handleChange}
              placeholder="ZIP Code"
              className="input"
            />
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-4">
            <input
              name="clinic_hospital"
              onChange={handleChange}
              placeholder="Name of clinic / hospital"
              className="input"
            />
            <input
              name="prc_license_number"
              onChange={handleChange}
              placeholder="PRC License Number"
              className="input"
            />
            <input
              name="prc_exp"
              onChange={handleChange}
              placeholder="PRC Expiration Date"
              className="input"
            />
          </div>
        )}
      </div>
    </main>
  );
}
