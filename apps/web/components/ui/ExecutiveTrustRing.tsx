"use client";

import { useTrust } from "@/contexts/TrustContext";
import { ShieldCheck } from "lucide-react";

export default function ExecutiveTrustRing() {

  const {
    score,
    grade,
    level,
  } = useTrust();

  const radius = 78;
  const stroke = 10;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (score / 100) * circumference;

  return (

    <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm p-8">

      <div className="flex justify-between items-center">

        <div>

          <h2 className="text-xl font-bold text-slate-900">

            Digital Trust

          </h2>

          <p className="text-sm text-slate-500">

            Executive Trust Index

          </p>

        </div>

        <div className="rounded-xl bg-emerald-100 p-2">

          <ShieldCheck className="h-6 w-6 text-emerald-600" />

        </div>

      </div>

      <div className="mt-8 flex justify-center">

        <div className="relative h-44 w-44">

          <svg
            className="-rotate-90"
            width="176"
            height="176"
          >

            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={stroke}
              fill="transparent"
            />

            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="#2563EB"
              strokeWidth={stroke}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition:
                  "stroke-dashoffset .8s ease",
              }}
            />

          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <h1 className="text-5xl font-black text-slate-900">

              {score}

            </h1>

            <p className="text-sm text-slate-500">

              Trust Score

            </p>

          </div>

        </div>

      </div>

      <div className="mt-8 space-y-4">

        <div className="flex justify-between">

          <span className="text-slate-500">

            Grade

          </span>

          <span className="font-bold text-slate-900">

            {grade}

          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-slate-500">

            Level

          </span>

          <span className="font-bold text-slate-900">

            {level}

          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-slate-500">

            Status

          </span>

          <span className="font-bold text-emerald-600">

            LIVE

          </span>

        </div>

      </div>

    </div>

  );

}
