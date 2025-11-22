'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, Bone, Droplet, X } from 'lucide-react';

interface BodyPart {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    position: { top: string; left: string };
    symptoms: { title: string; description: string }[];
}

const bodyParts: BodyPart[] = [
    {
        id: 'brain',
        name: 'Brain',
        icon: Brain,
        position: { top: '15%', left: '50%' },
        symptoms: [
            { title: 'Brain Fog', description: 'Difficulty concentrating and memory lapses due to fluctuating estrogen affecting neurotransmitters.' },
            { title: 'Anxiety', description: 'Heightened stress response and worry, linked to hormonal influence on GABA and serotonin levels.' },
        ],
    },
    {
        id: 'heart',
        name: 'Heart',
        icon: Heart,
        position: { top: '35%', left: '50%' },
        symptoms: [
            { title: 'Hot Flashes', description: 'Sudden warmth and sweating caused by hypothalamic temperature regulation disruption.' },
            { title: 'Palpitations', description: 'Racing or irregular heartbeat, often triggered by estrogen\'s role in cardiovascular function.' },
        ],
    },
    {
        id: 'joints',
        name: 'Joints',
        icon: Bone,
        position: { top: '55%', left: '35%' },
        symptoms: [
            { title: 'Joint Pain', description: 'Aches and stiffness from decreased estrogen affecting collagen and inflammation.' },
            { title: 'Bone Density Loss', description: 'Increased osteoporosis risk as estrogen protects against bone breakdown.' },
        ],
    },
    {
        id: 'skin',
        name: 'Skin',
        icon: Droplet,
        position: { top: '55%', left: '65%' },
        symptoms: [
            { title: 'Dryness', description: 'Reduced skin moisture and vaginal dryness from declining estrogen and collagen production.' },
            { title: 'Elasticity Loss', description: 'Wrinkles and sagging skin due to lower collagen and hyaluronic acid synthesis.' },
        ],
    },
];

export default function BodyMap() {
    const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);

    return (
        <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                        Interactive Symptom Map
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Click on different areas of the body to discover how menopause affects each system.
                    </p>
                </motion.div>

                <div className="relative max-w-md mx-auto">
                    {/* Body Silhouette */}
                    <div className="relative h-[600px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-full mx-auto w-64 shadow-inner">
                        {/* Abstract female figure representation */}
                        <div className="absolute top-[12%] left-1/2 transform -translate-x-1/2 w-20 h-20 bg-gray-300 rounded-full" />
                        <div className="absolute top-[28%] left-1/2 transform -translate-x-1/2 w-32 h-40 bg-gray-300 rounded-t-full" />
                        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 w-28 h-48 bg-gray-300 rounded-b-full" />
                    </div>

                    {/* Clickable Body Parts */}
                    {bodyParts.map((part) => {
                        const Icon = part.icon;
                        return (
                            <motion.button
                                key={part.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{ top: part.position.top, left: part.position.left }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedPart(part)}
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors cursor-pointer">
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    {/* Pulse animation */}
                                    <motion.div
                                        className="absolute inset-0 bg-red-600 rounded-full"
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    />
                                </div>
                                <p className="text-xs font-bold text-gray-700 mt-2">{part.name}</p>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Detail Modal */}
                <AnimatePresence>
                    {selectedPart && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 z-40"
                                onClick={() => setSelectedPart(null)}
                            />

                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8"
                            >
                                <button
                                    onClick={() => setSelectedPart(null)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="flex items-center gap-4 mb-6">
                                    {(() => {
                                        const Icon = selectedPart.icon;
                                        return <Icon className="w-12 h-12 text-red-600" />;
                                    })()}
                                    <h3 className="text-3xl font-serif font-bold text-gray-900">
                                        {selectedPart.name}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {selectedPart.symptoms.map((symptom, index) => (
                                        <motion.div
                                            key={symptom.title}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="border-l-4 border-blue-600 bg-blue-50 rounded-r-lg p-4"
                                        >
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">
                                                {symptom.title}
                                            </h4>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {symptom.description}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
