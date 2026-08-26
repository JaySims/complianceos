"use client";

import {
  InputHTMLAttributes,
  forwardRef,
} from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

const ExecutiveInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      helperText,
      error,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2">

        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}

        <input
          ref={ref}
          {...props}
          className={`
            w-full
            rounded-2xl
            border
            border-slate-300
            bg-white
            px-5
            py-4
            text-slate-900
            text-base
            placeholder:text-slate-400

            shadow-sm

            transition-all
            duration-200

            outline-none

            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-100
            focus:shadow-lg

            hover:border-slate-400

            disabled:bg-slate-100
            disabled:text-slate-400
            disabled:cursor-not-allowed

            ${error ? "border-red-500 focus:ring-red-100" : ""}

            ${className}
          `}
        />

        {helperText && !error && (
          <p className="text-sm text-slate-500">
            {helperText}
          </p>
        )}

        {error && (
          <p className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}

      </div>
    );
  }
);

ExecutiveInput.displayName = "ExecutiveInput";

export default ExecutiveInput;
