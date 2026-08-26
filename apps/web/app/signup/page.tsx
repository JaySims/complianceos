"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",

    companyName: "",
    tradingName: "",
    registrationNumber: "",
    website: "",
    industry: "",
    country: "",
    employees: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,

          companyName: form.companyName,
          tradingName: form.tradingName,
          registrationNumber: form.registrationNumber,
          website: form.website,
          industry: form.industry,
          country: form.country,
          employees: Number(form.employees),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message);
        return;
      }

      // Cookie is already stored by the server

      router.replace("/dashboard");
      router.refresh();

    } catch (error) {
      console.error(error);
      alert("Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 py-12 px-6">

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-10">

        <h1 className="text-4xl font-bold text-center">
          Register Your Business
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-10">
          Create your ComplianceOS Workspace
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <input
            name="fullName"
            placeholder="Full Name"
            className="w-full border rounded-lg p-4"
            value={form.fullName}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            className="w-full border rounded-lg p-4"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg p-4"
            value={form.password}
            onChange={handleChange}
            required
          />

          <hr />

          <input
            name="companyName"
            placeholder="Company Name"
            className="w-full border rounded-lg p-4"
            value={form.companyName}
            onChange={handleChange}
            required
          />

          <input
            name="tradingName"
            placeholder="Trading Name"
            className="w-full border rounded-lg p-4"
            value={form.tradingName}
            onChange={handleChange}
          />

          <input
            name="registrationNumber"
            placeholder="Registration Number"
            className="w-full border rounded-lg p-4"
            value={form.registrationNumber}
            onChange={handleChange}
          />

          <input
            name="website"
            placeholder="Website"
            className="w-full border rounded-lg p-4"
            value={form.website}
            onChange={handleChange}
          />

          <input
            name="industry"
            placeholder="Industry"
            className="w-full border rounded-lg p-4"
            value={form.industry}
            onChange={handleChange}
          />

          <input
            name="country"
            placeholder="Country"
            className="w-full border rounded-lg p-4"
            value={form.country}
            onChange={handleChange}
          />

          <input
            name="employees"
            type="number"
            placeholder="Number of Employees"
            className="w-full border rounded-lg p-4"
            value={form.employees}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 transition disabled:opacity-50"
          >
            {loading ? "Creating Workspace..." : "Create Workspace"}
          </button>

        </form>

      </div>

    </main>
  );
}
