/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";

type EnquiryPayload = {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  companyName: string;
  area: string;
  designation: string;
  password?: string; // if you want (as per screenshot)
  message?: string;

  // auto-filled
  productTitle?: string;
  productCode?: string;
  productId?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function EnquiryModal({
  open,
  onClose,
  productTitle,
  productCode,
  productId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  productTitle?: string;
  productCode?: string;
  productId?: string;
  onSubmit?: (payload: EnquiryPayload) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<EnquiryPayload>({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    companyName: "",
    area: "",
    designation: "",
    password: "",
    message: "",
    productTitle,
    productCode,
    productId,
  });

  // lock scroll + ESC close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    setForm((p) => ({
      ...p,
      productTitle,
      productCode,
      productId,
    }));
  }, [productTitle, productCode, productId]);

  if (!open) return null;

  const setField = (k: keyof EnquiryPayload, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const validate = () => {
    const f = form;

    if (!f.firstName.trim()) return "First Name is required";
    if (!f.lastName.trim()) return "Last Name is required";
    if (!f.mobile.trim()) return "Mobile Number is required";
    if (f.mobile.trim().length < 10) return "Enter a valid Mobile Number";
    if (!f.email.trim()) return "Email Address is required";
    if (!isValidEmail(f.email)) return "Enter a valid Email Address";
    if (!f.companyName.trim()) return "Company Name is required";
    if (!f.area.trim()) return "Area is required";
    if (!f.designation.trim()) return "Designation is required";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setErr(null);
    setLoading(true);
    try {
      await onSubmit?.({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        companyName: form.companyName.trim(),
        area: form.area.trim(),
        designation: form.designation.trim(),
        message: form.message?.trim(),
      });
      onClose();
      // optional: reset after close
      setForm((p) => ({
        ...p,
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        companyName: "",
        area: "",
        designation: "",
        password: "",
        message: "",
      }));
    } catch (e: any) {
      setErr(e?.message || "Failed to submit enquiry");
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="fixed inset-0 z-9999">
    {/* Backdrop */}
    <button
      type="button"
      onClick={onClose}
      className="absolute inset-0 bg-black/50"
      aria-label="Close modal"
    />

    {/* Center wrapper */}
    <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
      <div
        className="
          relative w-full max-w-lg
          bg-white border border-gray-200
          shadow-2xl
          
          overflow-hidden
          max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)]
        "
        role="dialog"
        aria-modal="true"
      >


        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="
            absolute right-3 top-3 z-30
            h-9 w-9 rounded-full
            grid place-items-center
            bg-white/80 backdrop-blur
            border border-gray-200
            text-gray-600 hover:text-gray-900 hover:bg-gray-50
          "
          aria-label="Close"
        >
          ✕
        </button>

        {/* Scroll container */}
        <div
          className="
            overflow-y-auto
            max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)]
            [scrollbar-width:thin]
            [scrollbar-color:#dc2626_#f3f4f6]
          "
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[18px] sm:text-[20px] font-bold text-gray-900">
                  Product Enquiry
                </div>
                <div className="mt-1 text-[12px] text-gray-500">
                  Fill the details and we’ll contact you shortly.
                </div>

                {(productTitle || productCode) && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">{productTitle || "-"}</span>
                    {productCode ? (
                      <>
                        {" "}
                        <span className="text-gray-400">•</span>{" "}
                        <span className="font-semibold text-gray-800">{productCode}</span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pt-5 pb-4">
            {/* Section label */}
            <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Contact Details
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* First Name */}
              <div className="sm:col-span-1">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  placeholder="e.g. Roshan"
                  className="
                    h-11 w-full 
                    border border-gray-200 bg-white
                    px-3 text-sm text-gray-900
                    outline-none
                    focus:border-gray-400 focus:ring-2 focus:ring-black/10
                  "
                />
              </div>

              {/* Last Name */}
              <div className="sm:col-span-1">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  placeholder="e.g. Kumar"
                  className="
                    h-11 w-full 
                    border border-gray-200 bg-white
                    px-3 text-sm text-gray-900
                    outline-none
                    focus:border-gray-400 focus:ring-2 focus:ring-black/10
                  "
                />
              </div>

              {/* Mobile */}
              <div className="sm:col-span-1">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  value={form.mobile}
                  onChange={(e) => setField("mobile", e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  className="
                    h-11 w-full 
                    border border-gray-200 bg-white
                    px-3 text-sm text-gray-900
                    outline-none
                    focus:border-gray-400 focus:ring-2 focus:ring-black/10
                  "
                />
              </div>

              {/* Email */}
              <div className="sm:col-span-1">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="name@company.com"
                  className="
                    h-11 w-full 
                    border border-gray-200 bg-white
                    px-3 text-sm text-gray-900
                    outline-none
                    focus:border-gray-400 focus:ring-2 focus:ring-black/10
                  "
                />
              </div>

              {/* Company */}
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  value={form.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  placeholder="Your company / shop name"
                  className="
                    h-11 w-full 
                    border border-gray-200 bg-white
                    px-3 text-sm text-gray-900
                    outline-none
                    focus:border-gray-400 focus:ring-2 focus:ring-black/10
                  "
                />
              </div>

              {/* Area */}
              <div className="sm:col-span-1">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  Area / City
                </label>
                <input
                  value={form.area}
                  onChange={(e) => setField("area", e.target.value)}
                  placeholder="e.g. Delhi"
                  className="
                    h-11 w-full 
                    border border-gray-200 bg-white
                    px-3 text-sm text-gray-900
                    outline-none
                    focus:border-gray-400 focus:ring-2 focus:ring-black/10
                  "
                />
              </div>

              {/* Designation */}
              <div className="sm:col-span-1">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  value={form.designation}
                  onChange={(e) => setField("designation", e.target.value)}
                  placeholder="e.g. Owner / Manager"
                  className="
                    h-11 w-full 
                    border border-gray-200 bg-white
                    px-3 text-sm text-gray-900
                    outline-none
                    focus:border-gray-400 focus:ring-2 focus:ring-black/10
                  "
                />
              </div>

              {/* Optional password */}
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  Password (optional)
                </label>
                <input
                  value={form.password || ""}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="If required"
                  type="password"
                  className="
                    h-11 w-full 
                    border border-gray-200 bg-white
                    px-3 text-sm text-gray-900
                    outline-none
                    focus:border-gray-400 focus:ring-2 focus:ring-black/10
                  "
                />
              </div>

              {/* Message */}
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={form.message || ""}
                  onChange={(e) => setField("message", e.target.value)}
                  placeholder="Tell us your requirement..."
                  rows={3}
                  className="
                    w-full 
                    border border-gray-200 bg-white
                    px-3 py-2 text-sm text-gray-900
                    outline-none resize-none
                    focus:border-gray-400 focus:ring-2 focus:ring-black/10
                  "
                />
              </div>
            </div>

            {/* Error */}
            {err && (
              <div className="mt-4  border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {err}
              </div>
            )}

            {/* Terms */}
            <div className="mt-4 text-[11px] text-gray-500 leading-relaxed">
              By submitting, you agree to our{" "}
              <span className="text-blue-600 font-semibold">Privacy Policy</span> &{" "}
              <span className="text-blue-600 font-semibold">Terms of Service</span>.
            </div>

            {/* Sticky footer button */}
            <div className="sticky bottom-0 left-0 right-0 mt-6 -mx-6 px-6 py-4 bg-white/95 backdrop-blur border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className={`
                  h-12 w-full  font-semibold text-sm transition
                  ${loading ? "bg-gray-200 text-gray-700" : "bg-black text-white hover:bg-gray-900"}
                `}
              >
                {loading ? "SUBMITTING…" : "SUBMIT ENQUIRY"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);


}
