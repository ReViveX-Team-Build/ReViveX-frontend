"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="relative">
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            placeholder=" "
            className={`
              peer w-full px-4 py-3 bg-white/5 border-2 rounded-xl
              text-white placeholder-transparent
              transition-all duration-300
              focus:outline-none focus:border-teal-400 focus:bg-white/10
              ${icon ? "pl-12" : ""}
              ${error ? "border-red-400" : "border-white/20 hover:border-white/40"}
              ${className}
            `}
          />
          <label
            className={`
              absolute left-4 transition-all duration-300 pointer-events-none
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base
              peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:bg-gradient-to-br peer-focus:from-slate-900 peer-focus:to-teal-900 peer-focus:px-2
              top-0 -translate-y-1/2 text-xs bg-gradient-to-br from-slate-900 to-teal-900 px-2
              ${icon ? "peer-placeholder-shown:left-12 peer-focus:left-4" : ""}
              ${error ? "text-red-400" : "text-teal-300"}
            `}
          >
            {label}
          </label>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

export default AuthInput;