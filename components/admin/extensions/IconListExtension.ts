import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import IconListNode from '@/components/admin/IconListNode'

export interface IconListItem {
    icon: string;
    title: string;
    text: string;
}

// Extensive map of Lucide icon SVGs to support the keywords
const iconSvgMap: Record<string, string> = {
    // Basic
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    
    // Warnings
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    danger: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    
    // Health / Body
    gut: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`, // Heart used for gut often
    heart: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`,
    brain: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path></svg>`,
    stomach: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>`,
    bacteria: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"></path><path d="M14.12 3.88 16 2"></path><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path><path d="M12 20v-9"></path><path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path><path d="M6 13H2"></path><path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path><path d="M22 13h-4"></path><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path></svg>`,
    
    // Nature / Ingredients
    natural: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10a6 6 0 0 0-6-6c0 0 0 3 0 12h3"></path><path d="M8 10a6 6 0 0 0 6-6c0 0 0 3 0 12h3"></path><path d="M16 10a6 6 0 0 0 6-6c0 0 0 3 0 12h-3"></path></svg>`, // TreeDeciduous/Leaf
    organic: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>`,
    
    // Shield / Protection
    shield: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    immune: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    
    // Energy / Zap
    energy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    zap: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    
    // Sleep
    sleep: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`,
    
    // Default Fallback
    default: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>`,
}

// Helper to get SVG string
const getIconSvg = (keyword: string): string => {
    const k = keyword.toLowerCase().trim()
    
    // Direct match
    if (iconSvgMap[k]) return iconSvgMap[k]
    
    // Mapped match (sync with IconList.tsx mappings)
    if (['stomach', 'digestion'].includes(k)) return iconSvgMap.stomach
    if (['probiotic', 'vitamin', 'pill'].includes(k)) return iconSvgMap.default // Pill not added, fallback
    if (['immunity', 'safe', 'verified'].includes(k)) return iconSvgMap.shield
    if (['powerful', 'fast'].includes(k)) return iconSvgMap.zap
    if (['leaf', 'organic', 'skin'].includes(k)) return iconSvgMap.natural
    if (['danger', 'risk', 'problem', 'issue'].includes(k)) return iconSvgMap.warning
    
    // Default
    return iconSvgMap.default
}

export default Node.create({
    name: 'iconList',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            items: {
                default: [
                    { icon: 'shield', title: 'Clinically Tested', text: 'Backed by peer-reviewed research and clinical trials.' },
                    { icon: 'check', title: 'Premium Ingredients', text: 'Only the highest quality, bioavailable compounds.' },
                ],
                parseHTML: element => {
                    const attr = element.getAttribute('data-items')
                    try {
                        return attr ? JSON.parse(attr) : undefined
                    } catch {
                        return undefined
                    }
                },
            },
            columns: {
                default: 2,
                parseHTML: element => {
                    const attr = element.getAttribute('data-columns')
                    return attr ? parseInt(attr) : 2
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="icon-list"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes, node }) {
        const { items, columns } = node.attrs

        const gridCols: Record<number, string> = {
            1: 'grid-cols-1',
            2: 'grid-cols-1 sm:grid-cols-2',
            3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        }

        // Safety check
        const safeItems = Array.isArray(items) ? items : []

        const itemElements = (safeItems as IconListItem[]).map((item) => {
            const svgContent = getIconSvg(item.icon)
            
            // We need to inject the SVG string into the HTML
            // Tiptap's renderHTML array syntax expects [tag, attrs, content]
            // For raw HTML content (SVG string), we can't easily pass it as a string literal in the 3rd arg 
            // if we want it parsed as HTML tags.
            // WORKAROUND: Use a 'span' wrapper and set innerHTML via a custom directive?
            // Tiptap renderHTML usually handles nested arrays. 
            // We can manually construct the SVG array structure? Too hard.
            // EASIER: Just use a data attribute for the keyword and assume client-side hydration?
            // NO, client side doesn't hydrate.
            
            // Solution: We must output the SVG. Since Tiptap doesn't support "raw string as HTML" easily in the array format 
            // without a parser, we will try to rely on the fact that if we can't output the SVG easily, 
            // we should at least output a fallback visually or use a span with the SVG as innerHTML if supported.
            // Actually, we can use `innerHTML` prop on a div if we cheat, but standard Tiptap doesn't like it.
            
            // BETTER: Use a span with a background-image/mask? No, color control is hard.
            // BEST: Just output the SVG structure as arrays. It's tedious but works.
            // BUT: I'll use a hack. I'll make the icon container a `div` and rely on a special class I'll add to `globals.css`? No.
            
            // Wait, I can just use a simple SVG structure for the *most common* case (circle) if I can't do full SVG.
            // OR I can use a `span` with `dangerouslySetInnerHTML` equivalent? No.
            
            // Let's use the 'innerHTML' attribute trick or simply put the SVG string as the content 
            // IF Tiptap supports raw strings being escaped? It escapes them.
            
            // OK, I'll use a simplified approach: I won't output complex SVGs. 
            // I'll output a simple emoji or character if I can't do SVG? No, unprofessional.
            
            // I will use a library or just write the SVG nodes for the most common 2-3 icons manually 
            // and fallback to a generic circle for others? No.
            
            // Let's try to pass the SVG string. If Tiptap escapes it, we see code.
            // I will output a `span` with `class="icon-renderer" data-icon="keyword"`.
            // AND I will add a small script or CSS? No.
            
            // Actually, `app/articles/[slug]/page.tsx` uses `dangerouslySetInnerHTML`. 
            // So if I can get the SVG *into* the string stored in DB, it works.
            // Tiptap `renderHTML` returns a DOM structure.
            // If I return `['div', { innerHTML: svgString }]`? Tiptap might treat it as an attribute.
            
            // Let's look at `IconListExtension` again.
            // I'll try to find a way to inject raw HTML.
            // It seems `['div', 0]` is for content hole.
            
            // I will parse the SVG string into Tiptap array format?
            // That's too complex for now.
            
            // Alternative:
            // Use an `img` tag with a data URI!
            // `src="data:image/svg+xml;base64,..."`
            // This is robust.
            const base64Svg = Buffer.from(svgContent).toString('base64');
            const dataUri = `data:image/svg+xml;base64,${base64Svg}`;
            
            return ['div', { class: 'group bg-gradient-to-br from-slate-50 to-white p-5 sm:p-6 rounded-xl border border-slate-200' },
                // Icon Container
                ['div', { class: 'w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center mb-4 text-emerald-600' },
                    ['img', { src: dataUri, class: 'w-6 h-6', alt: item.icon }]
                ],
                // Title
                ['h4', { class: 'text-base sm:text-lg font-bold text-gray-900 mb-2' }, item.title],
                // Text
                ['p', { class: 'text-sm sm:text-base text-gray-600 leading-relaxed' }, item.text]
            ]
        })

        return ['div', mergeAttributes(HTMLAttributes, { 
            'data-type': 'icon-list', 
            'data-items': JSON.stringify(safeItems),
            'data-columns': columns,
            class: 'my-10' 
        }),
            ['div', { class: `grid gap-4 sm:gap-6 ${gridCols[columns as number] || gridCols[2]}` },
                ...itemElements
            ]
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(IconListNode)
    },
})
