import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ComparisonTableNode from '@/components/admin/ComparisonTableNode'

export interface ComparisonFeature {
    name: string;
    us: boolean;
    them: boolean;
}

// Static SVG assets as Data URIs for reliable rendering without JS
const SVGS = {
    checkWhite: `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>').toString('base64')}`,
    xGray: `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>').toString('base64')}`,
    xRed: `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>').toString('base64')}`,
}

export default Node.create({
    name: 'comparisonTable',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            features: {
                default: [
                    { name: 'Lab Tested & Verified', us: true, them: false },
                    { name: 'High Potency Formula', us: true, them: false },
                    { name: 'No Artificial Fillers', us: true, them: false },
                    { name: '60-Day Guarantee', us: true, them: false },
                ],
                parseHTML: element => {
                    const attr = element.getAttribute('data-features')
                    try {
                        return attr ? JSON.parse(attr) : undefined
                    } catch {
                        return undefined
                    }
                },
            },
            ourBrand: {
                default: 'Our Formula',
                parseHTML: element => element.getAttribute('data-our-brand') || undefined,
            },
            theirBrand: {
                default: 'Generic Brands',
                parseHTML: element => element.getAttribute('data-their-brand') || undefined,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="comparison-table"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes, node }) {
        const { features, ourBrand, theirBrand } = node.attrs

        // Safety check
        const safeFeatures = Array.isArray(features) ? features : []

        // Build the table rows
        const rows = (safeFeatures as ComparisonFeature[]).map((feature, index) => {
            const isEven = index % 2 === 0
            const rowClass = isEven ? 'bg-emerald-50/30' : 'bg-white'

            // Us Column Icon
            const usIcon = feature.us
                ? ['div', { class: 'w-5 h-5 sm:w-6 sm:h-6 rounded bg-emerald-500 flex items-center justify-center shadow-sm' },
                    ['img', { src: SVGS.checkWhite, class: 'w-3.5 h-3.5 sm:w-4 sm:h-4', alt: 'Yes' }]
                  ]
                : ['div', { class: 'w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-200 flex items-center justify-center' },
                    ['img', { src: SVGS.xGray, class: 'w-3.5 h-3.5 sm:w-4 sm:h-4', alt: 'No' }]
                  ]

            // Them Column Icon
            const themIcon = feature.them
                ? ['div', { class: 'w-5 h-5 sm:w-6 sm:h-6 rounded bg-emerald-500 flex items-center justify-center shadow-sm' },
                    ['img', { src: SVGS.checkWhite, class: 'w-3.5 h-3.5 sm:w-4 sm:h-4', alt: 'Yes' }]
                  ]
                : ['div', { class: 'w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-100 flex items-center justify-center' },
                    ['img', { src: SVGS.xRed, class: 'w-3.5 h-3.5 sm:w-4 sm:h-4', alt: 'No' }]
                  ]

            return ['div', { class: `grid grid-cols-[80px_1fr_80px] sm:grid-cols-[100px_1fr_100px] items-stretch ${rowClass}` },
                // Us Col
                ['div', { class: 'p-2 sm:p-3 flex items-center justify-center border-r border-emerald-100/50 bg-emerald-50/30' }, usIcon],
                // Feature Col
                ['div', { class: 'p-2 sm:p-3 flex items-center justify-center text-center' },
                    ['span', { class: 'text-xs sm:text-sm text-gray-700 font-medium leading-snug' }, feature.name]
                ],
                // Them Col
                ['div', { class: 'p-2 sm:p-3 flex items-center justify-center border-l border-emerald-100/50' }, themIcon]
            ]
        })

        return ['div', mergeAttributes(HTMLAttributes, { 
            'data-type': 'comparison-table', 
            'data-features': JSON.stringify(safeFeatures),
            'data-our-brand': ourBrand,
            'data-their-brand': theirBrand,
            class: 'my-8 not-prose' 
        }),
            ['div', { class: 'bg-emerald-50/30 rounded-xl border-2 border-emerald-500/20 shadow-sm overflow-hidden' },
                // Header
                ['div', { class: 'grid grid-cols-[80px_1fr_80px] sm:grid-cols-[100px_1fr_100px] bg-white border-b border-emerald-100' },
                    ['div', { class: 'p-3 flex items-center justify-center bg-emerald-50/50 border-r border-emerald-100' },
                        ['span', { class: 'text-[10px] sm:text-xs font-black uppercase tracking-tight text-emerald-800 text-center leading-tight' }, ourBrand]
                    ],
                    ['div', { class: 'p-3 flex items-center justify-center' },
                        ['span', { class: 'text-sm font-bold text-gray-900' }, 'Feature']
                    ],
                    ['div', { class: 'p-3 flex items-center justify-center bg-gray-50/50 border-l border-emerald-100' },
                        ['span', { class: 'text-[10px] sm:text-xs font-bold uppercase tracking-tight text-gray-500 text-center leading-tight' }, theirBrand]
                    ]
                ],
                // Rows
                ['div', { class: 'divide-y divide-emerald-100/50 bg-white' },
                    ...rows
                ]
            ]
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(ComparisonTableNode)
    },
})
