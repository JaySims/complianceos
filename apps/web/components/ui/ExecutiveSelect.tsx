"use client";

import {
  SelectHTMLAttributes,
  forwardRef,
} from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

const ExecutiveSelect = forwardRef<HTMLSelectElement, Props>(
  (
    {
      label,
      helperText,
      error,
      className = "",
      children,
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

        <select
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

            text-base
            text-slate-900

            shadow-sm

            outline-none

            transition-all
            duration-200

            hover:border-slate-400

            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-100
            focus:shadow-lg

            disabled:bg-slate-100
            disabled:text-slate-400
            disabled:cursor-not-allowed

            appearance-none

            ${error ? "border-red-500 focus:ring-red-100" : ""}

            ${className}
          `}
        >
          {children}
        </select>

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

ExecutiveSelect.displayName = "ExecutiveSelect";

export default ExecutiveSelect;
