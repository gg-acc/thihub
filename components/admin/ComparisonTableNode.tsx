import { NodeViewWrapper } from '@tiptap/react'
import React from 'react'
import { Check, X, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ComparisonTableNode(props: any) {
    const { node, updateAttributes } = props;
    const { features = [], ourBrand = 'Our Formula', theirBrand = 'Generic Brands' } = node.attrs;

    const toggleFeature = (index: number, brand: 'us' | 'them') => {
        const newFeatures = [...features];
        newFeatures[index] = {
            ...newFeatures[index],
            [brand]: !newFeatures[index][brand]
        };
        updateAttributes({ features: newFeatures });
    };

    const updateFeatureName = (index: number, name: string) => {
        const newFeatures = [...features];
        newFeatures[index] = { ...newFeatures[index], name };
        updateAttributes({ features: newFeatures });
    };

    const addFeature = () => {
        updateAttributes({
            features: [...features, { name: 'New Feature', us: true, them: false }]
        });
    };

    const removeFeature = (index: number) => {
        const newFeatures = features.filter((_: any, i: number) => i !== index);
        updateAttributes({ features: newFeatures });
    };

    return (
        <NodeViewWrapper className="my-8 not-prose">
            <div className="bg-emerald-50/30 rounded-xl border-2 border-emerald-500/20 shadow-sm overflow-hidden group">
                {/* Header */}
                <div className="grid grid-cols-[100px_1fr_100px_40px] bg-white border-b border-emerald-100">
                    {/* Us Header */}
                    <div className="p-2 flex items-center justify-center bg-emerald-50/50 border-r border-emerald-100">
                        <input
                            type="text"
                            value={ourBrand}
                            onChange={(e) => updateAttributes({ ourBrand: e.target.value })}
                            className="w-full text-center text-xs font-black uppercase tracking-tight text-emerald-800 bg-transparent border-none focus:ring-0 focus:outline-none placeholder-emerald-800/50 leading-tight"
                            placeholder="Our Brand"
                        />
                    </div>
                    
                    {/* Feature Header */}
                    <div className="p-2 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">Feature</span>
                    </div>

                    {/* Them Header */}
                    <div className="p-2 flex items-center justify-center bg-gray-50/50 border-l border-emerald-100">
                        <input
                            type="text"
                            value={theirBrand}
                            onChange={(e) => updateAttributes({ theirBrand: e.target.value })}
                            className="w-full text-center text-xs font-bold uppercase tracking-tight text-gray-500 bg-transparent border-none focus:ring-0 focus:outline-none placeholder-gray-400 leading-tight"
                            placeholder="Competitors"
                        />
                    </div>
                    
                    {/* Actions Header Spacer */}
                    <div className="bg-gray-50"></div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-emerald-100/50 bg-white">
                    {features.map((feature: any, index: number) => (
                        <div
                            key={index}
                            className={cn(
                                "grid grid-cols-[100px_1fr_100px_40px] items-stretch transition-colors hover:bg-emerald-50/10",
                                index % 2 === 0 ? "bg-emerald-50/30" : "bg-white"
                            )}
                        >
                            {/* Us Column (Toggle) */}
                            <div 
                                className="p-2 flex items-center justify-center border-r border-emerald-100/50 bg-emerald-50/30 cursor-pointer hover:bg-emerald-100/50"
                                onClick={() => toggleFeature(index, 'us')}
                            >
                                {feature.us ? (
                                    <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center shadow-sm">
                                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                                        <X className="w-4 h-4 text-gray-400" strokeWidth={3} />
                                    </div>
                                )}
                            </div>

                            {/* Feature Name Input */}
                            <div className="p-2 flex items-center justify-center">
                                <input
                                    type="text"
                                    value={feature.name}
                                    onChange={(e) => updateFeatureName(index, e.target.value)}
                                    className="w-full text-center text-sm text-gray-700 font-medium bg-transparent border-none focus:ring-0 focus:outline-none placeholder-gray-400 leading-snug"
                                    placeholder="Feature Name..."
                                />
                            </div>

                            {/* Them Column (Toggle) */}
                            <div 
                                className="p-2 flex items-center justify-center border-l border-emerald-100/50 cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleFeature(index, 'them')}
                            >
                                {feature.them ? (
                                    <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center shadow-sm">
                                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                                        <X className="w-4 h-4 text-red-500" strokeWidth={3} />
                                    </div>
                                )}
                            </div>

                            {/* Delete Action */}
                            <div className="flex items-center justify-center">
                                <button
                                    onClick={() => removeFeature(index)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Remove row"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="p-3 bg-gray-50 border-t border-emerald-100 flex justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addFeature}
                        className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                        <Plus className="w-3 h-3 mr-1.5" />
                        Add Comparison Feature
                    </Button>
                </div>
            </div>
        </NodeViewWrapper>
    );
}
