"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import emailjs from "emailjs-com";
import toast from "react-hot-toast";

import { pdf } from "@react-pdf/renderer";
import { MyPDFDocument } from "../components/MyPDFDocument-D1"; // adjust path if needed

const SurveyPage = () => {
  const [form, setForm] = useState({
    email: "",
    partsAttended: [] as string[],
    experience: "",
    standout: "",
    tracksAttended: [] as string[],
    relevance: "",
    mostValuable: "",
    suggestions: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle checkbox group (multi-select fields)
  const handleCheckbox = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "partsAttended" | "tracksAttended"
  ) => {
    const { value, checked } = e.target;
    setForm((prev) => {
      const updated = checked
        ? [...prev[field], value]
        : prev[field].filter((v) => v !== value);
      return { ...prev, [field]: updated };
    });
  };

  // Handle all text inputs and radios
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (form.partsAttended.length === 0) {
      toast.error("Please select at least one part you attended.");
      setIsSubmitting(false);
      return;
    }

    if (form.tracksAttended.length === 0) {
      toast.error("Please select at least one track you attended.");
      setIsSubmitting(false);
      return;
    }

    try {
      // ✅ First, check if already submitted
      const { data: existingEntry, error: checkError } = await supabase
        .from("satf_2025_survey")
        .select("email")
        .eq("email", form.email)
        .maybeSingle();

      if (checkError) {
        throw new Error("Failed to check existing survey submission.");
      }

      if (existingEntry) {
        toast.error("You have already submitted this survey.");
        setIsSubmitting(false);
        return;
      }

      // ✅ Fetch participant name
      let fullName = "";

      // Check all participant tables for name lookup
      const [online17, onsite17] = await Promise.all([
        supabase
          .from("satf_participant_online_17")
          .select("first_name_upper, last_name_upper")
          .eq("email", form.email)
          .maybeSingle(),

        supabase
          .from("satf_participant_onsite_17")
          .select("first_name_upper, last_name_upper")
          .eq("email", form.email)
          .maybeSingle(),
      ]);

      const match = online17.data ?? onsite17.data;

      if (match) {
        fullName = `${match.first_name_upper} ${match.last_name_upper}`;
      } else {
        toast.error("Participant name not found.");
        setIsSubmitting(false);
        return;
      }

      toast.loading(
        "Generating your certificate PDF... ⏳\nPlease keep the page open."
      );

      // ✅ Generate and download PDF
      const generatedBlob = await pdf(
        <MyPDFDocument name={fullName} />
      ).toBlob();

      const blobURL = URL.createObjectURL(generatedBlob);
      const link = document.createElement("a");
      link.href = blobURL;
      link.download = "SATF-Survey-Certificate.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobURL);

      // ✅ Then insert the survey result
      const formattedTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const { error: insertError } = await supabase.rpc(
        "insert_survey_with_name",
        {
          p_email: form.email,
          p_parts_attended: form.partsAttended,
          p_experience: form.experience,
          p_standout: form.standout,
          p_tracks_attended: form.tracksAttended,
          p_relevance: form.relevance,
          p_most_valuable: form.mostValuable,
          p_suggestions: form.suggestions,
          p_formatted_time_submitted: formattedTime,
        }
      );

      if (insertError) {
        throw insertError;
      }

      // ✅ Send confirmation email
      await emailjs.send(
        "service_02hek52",
        "template_hnce2jl",
        { email: form.email },
        "sOTpCYbD5KllwgbCD"
      );

      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 text-center text-green-600 text-xl">
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl h-auto mx-auto p-12 bg-white shadow rounded space-y-6 text-gray-800"
      >
        <div className="w-fit h-auto">
          <h1 className="text-[30px] font-bold">Survey</h1>
          <div
            className="w-24 h-1 rounded"
            style={{
              background: "linear-gradient(to right, blue, green, yellow, red)",
            }}
          ></div>
        </div>
        <p className="text-[14px] mb-4">
          <strong>July 17, 2025</strong>
        </p>
        <p className="text-[14px] mb-8 italic">
          Please enter the <strong>same email</strong> you used during
          registration. This will be used to validate your participation and
          generate your certificate.
        </p>

        <label className="block">
          Your Email:
          <input
            name="email"
            type="email"
            required
            className="w-full border p-2 mt-1 rounded"
            value={form.email}
            onChange={handleChange}
          />
        </label>

        <div>
          <p className="font-semibold">1. Which part(s) did you attend?</p>
          {["SATF Main Forum", "B2B Connect"].map((label) => (
            <label key={label} className="block cursor-pointer">
              <input
                type="checkbox"
                value={label}
                checked={form.partsAttended.includes(label)}
                onChange={(e) => handleCheckbox(e, "partsAttended")}
              />{" "}
              {label}
            </label>
          ))}
        </div>

        <div>
          <p className="font-semibold">
            2. How would you rate your overall experience?
          </p>
          {["Excellent", "Good", "Average", "Poor"].map((option) => (
            <label key={option} className="block cursor-pointer">
              <input
                type="radio"
                name="experience"
                value={option}
                checked={form.experience === option}
                onChange={handleChange}
                required
              />{" "}
              {option}
            </label>
          ))}
          <textarea
            name="standout"
            placeholder="Optional: What stood out to you the most?"
            className="w-full border p-2 mt-2 rounded"
            value={form.standout}
            onChange={handleChange}
          />
        </div>

        <div>
          <p className="font-semibold">3. Which track(s) did you attend?</p>
          {["Layers – July 17, 2025", "Swine – July 24, 2025"].map((label) => (
            <label key={label} className="block cursor-pointer">
              <input
                type="checkbox"
                value={label}
                checked={form.tracksAttended.includes(label)}
                onChange={(e) => handleCheckbox(e, "tracksAttended")}
              />{" "}
              {label}
            </label>
          ))}
        </div>

        <div>
          <p className="font-semibold">
            4. Was the information or engagement relevant?
          </p>
          {["Yes", "Somewhat", "No"].map((option) => (
            <label key={option} className="block cursor-pointer">
              <input
                type="radio"
                name="relevance"
                value={option}
                checked={form.relevance === option}
                onChange={handleChange}
                required
              />{" "}
              {option}
            </label>
          ))}
          <textarea
            name="mostValuable"
            placeholder="Optional: What topic or company did you find most valuable?"
            className="w-full border p-2 mt-2 rounded"
            value={form.mostValuable}
            onChange={handleChange}
          />
        </div>

        <div>
          <p className="font-semibold">
            5. What can we improve for future events?
          </p>
          <textarea
            name="suggestions"
            rows={3}
            required
            className="w-full border p-2 rounded"
            value={form.suggestions}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className={`w-full mt-6 py-3 px-4 rounded-[10px] text-white font-semibold transition duration-300 ${
            isSubmitting
              ? "bg-[#0060DC] cursor-not-allowed"
              : "bg-[linear-gradient(to_right,_#0060DC,_#00E071)] hover:opacity-90 cursor-pointer"
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Survey"}
        </button>
      </form>
    </div>
  );
};

export default SurveyPage;
