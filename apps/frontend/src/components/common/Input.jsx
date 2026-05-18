import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

const Input = forwardRef(function Input(
    {
        label,
        error,
        icon: Icon,
        className = "",
        containerClassName = "",
        ...props
    },
    ref
) {
    return (
        <div className={`form-control ${containerClassName}`}>
            {label && (
                <label className="label">
                    <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </span>
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    ref={ref}
                    className={`input input-bordered w-full ${
                        Icon ? "pl-10" : ""
                    } ${error ? "input-error" : ""} ${className}`}
                    {...props}
                />
            </div>
            {error && (
                <label className="label">
                    <span className="label-text-alt text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </span>
                </label>
            )}
        </div>
    );
});

const Textarea = forwardRef(function Textarea(
    { label, error, className = "", containerClassName = "", ...props },
    ref
) {
    return (
        <div className={`form-control ${containerClassName}`}>
            {label && (
                <label className="label">
                    <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </span>
                </label>
            )}
            <textarea
                ref={ref}
                className={`textarea textarea-bordered ${error ? "textarea-error" : ""} ${className}`}
                {...props}
            />
            {error && (
                <label className="label">
                    <span className="label-text-alt text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </span>
                </label>
            )}
        </div>
    );
});

const Select = forwardRef(function Select(
    { label, error, options = [], placeholder, className = "", containerClassName = "", ...props },
    ref
) {
    return (
        <div className={`form-control ${containerClassName}`}>
            {label && (
                <label className="label">
                    <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </span>
                </label>
            )}
            <select
                ref={ref}
                className={`select select-bordered ${error ? "select-error" : ""} ${className}`}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <label className="label">
                    <span className="label-text-alt text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </span>
                </label>
            )}
        </div>
    );
});

export { Input, Textarea, Select };