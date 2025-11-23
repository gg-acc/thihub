import { NodeViewWrapper } from '@tiptap/react'
import React, { useEffect, useState } from 'react'
import { Check, Star, Quote } from 'lucide-react'

export default function TestimonialNode(props: any) {
    const { node, updateAttributes } = props

    // Random author generator helper
    const generateRandomAuthor = () => {
        const names = ['Sarah', 'Jennifer', 'Jessica', 'Amanda', 'Melissa', 'Nicole', 'Stephanie', 'Elizabeth', 'Heather', 'Michelle']
        const lastInitials = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'W']

        const randomName = names[Math.floor(Math.random() * names.length)]
        const randomInitial = lastInitials[Math.floor(Math.random() * lastInitials.length)]

        return `${randomName} ${randomInitial}.`
    }

    // Initialize with random author if default
    useEffect(() => {
        if (node.attrs.author === 'Sarah J.') {
            // Only randomize if it's the exact default, to avoid overwriting user edits on reload
            // But actually, 'Sarah J.' is a fine default. Let's just provide a button to randomize.
        }
    }, [])

    const handleRandomizeAuthor = () => {
        updateAttributes({ author: generateRandomAuthor() })
    }

    return (
        <NodeViewWrapper className="my-12">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group">

                {/* Decorative Quote Icon */}
                <div className="absolute top-4 right-4 text-blue-100 opacity-50 pointer-events-none">
                    <Quote size={80} strokeWidth={1} fill="currentColor" />
                </div>

                {/* Editable "Helped With" Tag */}
                <div className="relative z-10 mb-6">
                    <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400">Helped with</span>
                        <input
                            type="text"
                            value={node.attrs.helpedWith}
                            onChange={(e) => updateAttributes({ helpedWith: e.target.value })}
                            className="bg-transparent border-none p-0 text-xs font-bold text-blue-900 focus:ring-0 placeholder-blue-200 w-auto min-w-[80px]"
                            placeholder="Improvement..."
                        />
                    </div>
                </div>

                {/* Editable Title */}
                <div className="relative z-10 mb-4">
                    <input
                        type="text"
                        value={node.attrs.title}
                        onChange={(e) => updateAttributes({ title: e.target.value })}
                        className="w-full bg-transparent border-none p-0 text-xl font-serif font-bold text-gray-900 focus:ring-0 placeholder-gray-300"
                        placeholder="Testimonial Title"
                    />
                </div>

                {/* Editable Body */}
                <div className="relative z-10 mb-6">
                    <textarea
                        value={node.attrs.body}
                        onChange={(e) => {
                            updateAttributes({ body: e.target.value })
                            e.target.style.height = 'auto'
                            e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        className="w-full bg-transparent border-none p-0 text-lg text-gray-700 leading-relaxed focus:ring-0 resize-none overflow-hidden placeholder-gray-300 font-sans"
                        rows={2}
                        placeholder="Testimonial content..."
                    />
                </div>

                {/* Author & Verification */}
                <div className="relative z-10 flex items-center justify-between border-t border-blue-100 pt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {node.attrs.author.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={node.attrs.author}
                                    onChange={(e) => updateAttributes({ author: e.target.value })}
                                    className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 w-auto"
                                />
                                <button
                                    onClick={handleRandomizeAuthor}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-400 hover:text-blue-600"
                                    title="Randomize Name"
                                >
                                    🎲
                                </button>
                            </div>
                            <div className="flex items-center gap-1 text-green-600">
                                <Check size={12} strokeWidth={3} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Verified Purchase</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-0.5 text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                        ))}
                    </div>
                </div>

            </div>
        </NodeViewWrapper>
    )
}
