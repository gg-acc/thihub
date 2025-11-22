'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';

interface ScienceTerm {
    id: string;
    term: string;
    definition: string;
    diagram: 'microbiome' | 'atrophy' | 'phytoestrogens';
}

const terms: ScienceTerm[] = [
    {
        id: '1',
        term: 'Microbiome',
        definition: 'The trillions of bacteria in your gut that produce neurotransmitters, metabolize hormones, and regulate inflammation. An imbalanced microbiome during menopause can worsen symptoms.',
        diagram: 'microbiome',
    },
    {
        id: '2',
        term: 'Vaginal Atrophy',
        definition: 'The thinning, drying, and inflammation of vaginal walls due to declining estrogen. Affects up to 50% of postmenopausal women and is medically treatable with topical estrogen.',
        diagram: 'atrophy',
    },
    {
        id: '3',
        term: 'Phytoestrogens',
        definition: 'Plant compounds that weakly mimic estrogen in the body. Found in soy, flax, and legumes. May provide mild symptom relief, though effects vary by individual.',
        diagram: 'phytoestrogens',
    },
];

export default function ScienceExplainer() {
    const [openTerm, setOpenTerm] = useState<string | null>(null);

    const toggleTerm = (id: string) => {
        setOpenTerm(openTerm === id ? null : id);
    };

    const renderDiagram = (diagram: string) => {
        switch (diagram) {
            case 'microbiome':
                return (
                    <div className="relative h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full bg-white"
                                style={{
                                    width: Math.random() * 20 + 10,
                                    height: Math.random() * 20 + 10,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -10, 0],
                                    opacity: [0.3, 0.8, 0.3],
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                }}
                            />
                        ))}
                        <p className="relative z-10 text-white font-bold text-lg">Gut Bacteria</p>
                    </div>
                );

            case 'atrophy':
                return (
                    <div className="relative h-32 bg-gradient-to-r from-pink-400 to-rose-500 rounded-lg flex items-center justify-center">
                        <div className="flex gap-8">
                            <div className="text-center">
                                <div className="w-16 h-20 bg-white/30 rounded-lg mb-2" />
                                <p className="text-white text-xs font-bold">Before</p>
                            </div>
                            <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                →
                            </motion.div>
                            <div className="text-center">
                                <div className="w-12 h-16 bg-white/50 rounded-lg mb-2" />
                                <p className="text-white text-xs font-bold">After</p>
                            </div>
                        </div>
                    </div>
                );

            case 'phytoestrogens':
                return (
                    <div className="relative h-32 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center overflow-hidden">
                        <div className="flex items-center gap-4">
                            {['🌱', '🫘', '🌾'].map((emoji, i) => (
                                <motion.div
                                    key={i}
                                    className="text-4xl"
                                    animate={{
                                        scale: [1, 1.2, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.3,
                                    }}
                                >
                                    {emoji}
                                </motion.div>
                            ))}
                        </div>
                        <Sparkles className="absolute top-2 right-2 w-6 h-6 text-white" />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                        Science Made Simple
                    </h2>
                    <p className="text-lg text-gray-600">
                        Click to expand and understand the key concepts behind menopause.
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {terms.map((item, index) => {
                        const isOpen = openTerm === item.id;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-md overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleTerm(item.id)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-xl font-bold text-gray-900 font-serif">
                                        {item.term}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChevronDown className="w-6 h-6 text-gray-500" />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-6 space-y-4">
                                                {/* Definition */}
                                                <p className="text-gray-700 leading-relaxed">
                                                    {item.definition}
                                                </p>

                                                {/* Animated Diagram */}
                                                <div className="mt-4">
                                                    {renderDiagram(item.diagram)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
