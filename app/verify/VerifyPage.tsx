"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import emailjs from "@emailjs/browser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setMessage(null);

    // Insert data into your Supabase table
    const { data, error } = await supabase
      .from("sat_forum_registration")
      .insert([
        {
          email,
          name,
          contact_number: contactNumber,
        },
      ]);
    console.log("Inserted data:", data);

    if (error) {
      setMessage(`Error saving data: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    // Create QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      email
    )}`;

    // Prepare EmailJS template params
    const templateParams = {
      email,
      name,
      contact_number: contactNumber,
      qr_code_url: qrCodeUrl,
    };

    // Send email with EmailJS
    emailjs
      .send(
        "service_1qkyi2i", // your service ID
        "template_28r3rcr", // your template ID
        templateParams,
        "sOTpCYbD5KllwgbCD" // your public key
      )
      .then(() => {
        setMessage("Data saved and QR code email sent!");
        setIsSubmitting(false);
      })
      .catch((err) => {
        setMessage("Failed to send email: " + err.text || err.message);
        setIsSubmitting(false);
      });
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verify and Send QR Code</h1>

      {message && (
        <p
          className={`mb-4 ${
            message.includes("Error") || message.includes("Failed")
              ? "text-red-600"
              : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label>
          Email:
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </label>

        <label>
          Name:
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </label>

        <label>
          Contact Number:
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Submit & Send QR"}
        </button>
      </form>
    </div>
  );
}
