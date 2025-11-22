'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function LifestyleSlider() {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = () => {
        isDragging.current = true;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    return (
        <section className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                        Lifestyle's Cellular Impact
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Drag the slider to compare how stress vs. balance affects your body at the cellular level.
                    </p>
                </motion.div>

                <div
                    ref={containerRef}
                    className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleTouchMove}
                >
                    {/* Right Side - Balanced/Managed */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white p-8">
                                <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">Balanced</h3>
                                <div className="space-y-2 text-left max-w-md">
                                    <p className="text-sm md:text-base">✓ Regulated cortisol</p>
                                    <p className="text-sm md:text-base">✓ Mitochondria functioning</p>
                                    <p className="text-sm md:text-base">✓ Reduced inflammation</p>
                                    <p className="text-sm md:text-base">✓ Cellular repair active</p>
                                    <p className="text-sm md:text-base">✓ Stable blood sugar</p>
                                </div>
                            </div>
                        </div>
                        {/* Abstract cellular pattern */}
                        <div className="absolute inset-0 opacity-20">
                            {[...Array(15)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full bg-white"
                                    style={{
                                        width: Math.random() * 100 + 50,
                                        height: Math.random() * 100 + 50,
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Left Side - Stressed/High Cortisol */}
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-red-600 via-orange-600 to-amber-600"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white p-8">
                                <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">Stressed</h3>
                                <div className="space-y-2 text-left max-w-md">
                                    <p className="text-sm md:text-base">✗ Elevated cortisol</p>
                                    <p className="text-sm md:text-base">✗ Mitochondrial dysfunction</p>
                                    <p className="text-sm md:text-base">✗ Chronic inflammation</p>
                                    <p className="text-sm md:text-base">✗ Cellular damage accumulating</p>
                                    <p className="text-sm md:text-base">✗ Insulin resistance</p>
                                </div>
                            </div>
                        </div>
                        {/* Chaotic pattern */}
                        <div className="absolute inset-0 opacity-20">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute bg-white"
                                    style={{
                                        width: Math.random() * 60 + 20,
                                        height: Math.random() * 60 + 20,
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        transform: `rotate(${Math.random() * 360}deg)`,
                                    }}
                                    animate={{
                                        rotate: [0, 360],
                                        scale: [1, 1.3, 0.8, 1],
                                    }}
                                    transition={{
                                        duration: 2 + Math.random(),
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Slider Handle */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl"
                        style={{ left: `${sliderPosition}%` }}
                    >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
                            <div className="flex gap-1">
                                <div className="w-0.5 h-6 bg-gray-400" />
                                <div className="w-0.5 h-6 bg-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Drag the handle to visualize the difference
                </p>
            </div>
        </section>
    );
}
