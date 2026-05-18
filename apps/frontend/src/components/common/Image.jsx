import { useState, useEffect, useRef } from "react";

/**
 * Optimized image component with lazy loading and placeholder
 */
export function Image({
    src,
    alt = "",
    className = "",
    placeholder = "bg-slate-200 dark:bg-slate-700",
    onLoad,
    onError,
    ...props
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "100px" }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${placeholder} ${className}`}
            {...props}
        >
            {isVisible && !hasError && (
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                />
            )}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">Image failed to load</span>
                </div>
            )}
        </div>
    );
}

/**
 * Avatar component with fallback initials
 */
export function Avatar({ src, name = "", size = "md", className = "" }) {
    const [imgError, setImgError] = useState(false);

    const sizeClasses = {
        xs: "w-6 h-6 text-xs",
        sm: "w-8 h-8 text-sm",
        md: "w-10 h-10 text-base",
        lg: "w-12 h-12 text-lg",
        xl: "w-16 h-16 text-xl",
    };

    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getColorFromName = (name) => {
        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-yellow-500",
            "bg-red-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-indigo-500",
            "bg-teal-500",
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    if (!imgError && src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div
            className={`${sizeClasses[size]} ${getColorFromName(name)} rounded-full flex items-center justify-center text-white font-medium ${className}`}
        >
            {getInitials(name)}
        </div>
    );
}