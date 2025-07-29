"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import emailjs from "emailjs-com";
import toast from "react-hot-toast";

import { pdf } from "@react-pdf/renderer";
import { MyPDFDocument } from "../components/MyPDFDocument-D2";

const SurveyPage = () => {
  const [form, setForm] = useState({
    email: "",
    partsAttended: [] as string[],
    experience: "",
    standout: "",
    relevance: "",
    mostValuable: "",
    suggestions: "",
    rolesAttended: "", // ✅ changed from string[] to string
    otherRole: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckbox = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "partsAttended"
  ) => {
    const { value, checked } = e.target;
    setForm((prev) => {
      const updated = checked
        ? [...prev[field], value]
        : prev[field].filter((v) => v !== value);
      return { ...prev, [field]: updated };
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (form.partsAttended.length === 0) {
      toast.error("Please select at least one part you attended.");
      setIsSubmitting(false);
      return;
    }

    if (form.rolesAttended.length === 0) {
      toast.error("Please select your role at the event.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: existingEntry, error: checkError } = await supabase
        .from("satf_2025_survey")
        .select("email")
        .eq("email", form.email)
        .maybeSingle();

      if (checkError) throw new Error("Failed to check existing submission.");
      if (existingEntry) {
        toast.error("You have already submitted this survey.");
        setIsSubmitting(false);
        return;
      }

      const [online24, onsite24] = await Promise.all([
        supabase
          .from("satf_participant_online_24")
          .select("first_name_upper, last_name_upper")
          .eq("email", form.email)
          .maybeSingle(),

        supabase
          .from("satf_participant_onsite_24")
          .select("first_name_upper, last_name_upper")
          .eq("email", form.email)
          .maybeSingle(),
      ]);

      const match = online24.data ?? onsite24.data;
      if (!match) {
        toast.error("Participant name not found.");
        setIsSubmitting(false);
        return;
      }

      const fullName = `${match.first_name_upper} ${match.last_name_upper}`;
      toast.loading(
        "Generating your certificate PDF... ⏳\nPlease keep the page open."
      );

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
          p_relevance: form.relevance,
          p_most_valuable: form.mostValuable,
          p_suggestions: form.suggestions,
          p_role_attended: form.rolesAttended,
          p_other_role: form.otherRole,
          p_formatted_time_submitted: formattedTime,
        }
      );

      if (insertError) throw insertError;

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
    } finally {
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
          <strong>July 24, 2025</strong>
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
          <p className="font-semibold">3. What was your role at the event?</p>
          {[
            "Farmer / Producer",
            "Veterinarian / Technical Professional",
            "Distributor / Supplier",
            "Company Representative",
            "Student",
            "Other",
          ].map((label) => (
            <label key={label} className="block cursor-pointer">
              <input
                type="radio"
                name="rolesAttended"
                value={label}
                checked={form.rolesAttended === label}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    rolesAttended: e.target.value,
                  }))
                }
              />{" "}
              {label}
              {label === "Other" && form.rolesAttended === "Other" && (
                <input
                  type="text"
                  className="ml-2 border-b border-gray-400 outline-none"
                  placeholder="Please specify"
                  value={form.otherRole}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, otherRole: e.target.value }))
                  }
                />
              )}
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
