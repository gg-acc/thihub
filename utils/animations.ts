// Shared Framer Motion animation variants for consistent animations across components

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

export const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
};

export const fadeInDown = {
    hidden: { opacity: 0, y: -30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

export const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

// Spring presets for physics-based animations
export const springPreset = {
    type: "spring" as const,
    stiffness: 100,
    damping: 15
};

export const gentleSpring = {
    type: "spring" as const,
    stiffness: 50,
    damping: 20
};

export const bouncySpring = {
    type: "spring" as const,
    stiffness: 300,
    damping: 10
};
