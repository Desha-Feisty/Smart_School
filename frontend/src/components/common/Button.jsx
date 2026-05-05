import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const Button = forwardRef(function Button(
    {
        children,
        variant = "primary",
        size = "md",
        loading = false,
        disabled = false,
        icon: Icon,
        iconPosition = "left",
        className = "",
        ...props
    },
    ref
) {
    const variants = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        accent: "btn-accent",
        ghost: "btn-ghost",
        link: "btn-link",
        info: "btn-info",
        success: "btn-success",
        warning: "btn-warning",
        error: "btn-error",
    };

    const sizes = {
        xs: "btn-xs",
        sm: "btn-sm",
        md: "",
        lg: "btn-lg",
    };

    const iconSizes = {
        xs: "w-3 h-3",
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    return (
        <button
            ref={ref}
            className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2 className={`animate-spin ${iconSizes[size]}`} />
            ) : (
                <>
                    {Icon && iconPosition === "left" && (
                        <Icon className={iconSizes[size]} />
                    )}
                    {children}
                    {Icon && iconPosition === "right" && (
                        <Icon className={iconSizes[size]} />
                    )}
                </>
            )}
        </button>
    );
});

export default Button;