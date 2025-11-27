'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ArrowLeft,
    Save,
    Eye,
    Settings,
    Plus,
    Trash2,
    GripVertical,
    Copy,
    MoreVertical,
    Loader2,
    Smartphone,
    Monitor,
    ChevronUp,
    ChevronDown,
    Image as ImageIcon,
    Type,
    CheckSquare,
    FileText,
    Loader,
    Award,
    ShoppingCart,
    Upload,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
interface SlideOption {
    id: string;
    text: string;
    imageUrl?: string;
    nextSlide?: string | 'next' | 'end';
    category?: string; // For scoring/results
}

interface ContentBlock {
    id: string;
    type: 'heading' | 'paragraph' | 'image' | 'quote';
    content: string;
    author?: string; // for quote blocks
}

interface ResultCategory {
    id: string;
    name: string;
    headline: string;
    body: string;
    imageUrl?: string;
}

interface SlideContent {
    headline?: string;
    subheadline?: string;
    body?: string;
    imageUrl?: string;
    videoUrl?: string;
    buttonText?: string;
    options?: SlideOption[];
    items?: { text: string; duration?: number }[];
    summaryTemplate?: string;
    dynamicFields?: string[];
    bullets?: string[];
    offerText?: string;
    ctaText?: string;
    ctaUrl?: string;
    guaranteeText?: string;
    // Flexible content blocks for info slides
    blocks?: ContentBlock[];
    // Dynamic results
    resultCategories?: ResultCategory[];
}

interface Slide {
    id: string;
    type: 'text-choice' | 'image-choice' | 'multi-select' | 'info' | 'loading' | 'results' | 'offer';
    content: SlideContent;
    conditionalLogic?: { showIf?: { slideId: string; optionId: string } } | null;
}

interface Quiz {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    status: 'draft' | 'published' | 'archived';
    settings: {
        primaryColor: string;
        backgroundColor: string;
        showProgressBar: boolean;
        allowBack: boolean;
    };
    slides: Slide[];
}

const SLIDE_TYPES = [
    { value: 'text-choice', label: 'Text Choice', icon: Type, description: 'Multiple choice with text options' },
    { value: 'image-choice', label: 'Image Choice', icon: ImageIcon, description: 'Options with images' },
    { value: 'multi-select', label: 'Multi Select', icon: CheckSquare, description: 'Select multiple options' },
    { value: 'info', label: 'Info / Story', icon: FileText, description: 'Educational content slide' },
    { value: 'loading', label: 'Loading', icon: Loader, description: 'Animated analysis screen' },
    { value: 'results', label: 'Results', icon: Award, description: 'Dynamic results page' },
    { value: 'offer', label: 'Offer / CTA', icon: ShoppingCart, description: 'Final offer slide' },
];

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

// Sortable Slide Item Component
function SortableSlideItem({
    slide,
    index,
    isSelected,
    onSelect,
    onDuplicate,
    onDelete,
    canDelete,
}: {
    slide: Slide;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    canDelete: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={cn(
                'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                isSelected ? 'bg-accent' : 'hover:bg-accent/50',
                isDragging && 'shadow-lg ring-2 ring-primary/20'
            )}
        >
            {/* Drag Handle */}
            <button
                className="touch-none cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-muted-foreground w-4 shrink-0">{index + 1}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                        {slide.content.headline || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                        {slide.type.replace('-', ' ')}
                    </p>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreVertical className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        disabled={!canDelete}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function getDefaultContent(type: string): SlideContent {
    switch (type) {
        case 'text-choice':
        case 'image-choice':
            return {
                headline: 'Your question here?',
                subheadline: '',
                options: [
                    { id: generateId(), text: 'Option 1' },
                    { id: generateId(), text: 'Option 2' },
                    { id: generateId(), text: 'Option 3' },
                ],
            };
        case 'multi-select':
            return {
                headline: 'Select all that apply',
                subheadline: '',
                options: [
                    { id: generateId(), text: 'Option 1' },
                    { id: generateId(), text: 'Option 2' },
                    { id: generateId(), text: 'Option 3' },
                ],
                buttonText: 'Continue',
            };
        case 'info':
            return {
                headline: 'Important Information',
                blocks: [
                    { id: generateId(), type: 'paragraph', content: 'Add your story or educational content here...' },
                ],
                buttonText: 'Continue',
            };
        case 'loading':
            return {
                headline: 'Analyzing your answers...',
                items: [
                    { text: 'Processing responses...', duration: 2000 },
                    { text: 'Calculating results...', duration: 2000 },
                    { text: 'Preparing your report...', duration: 2000 },
                ],
            };
        case 'results':
            return {
                headline: 'Your Results',
                body: 'Based on your answers, here is what we found...',
                resultCategories: [
                    { id: generateId(), name: 'Type A', headline: 'You are Type A!', body: 'Description for Type A results...' },
                    { id: generateId(), name: 'Type B', headline: 'You are Type B!', body: 'Description for Type B results...' },
                ],
            };
        case 'offer':
            return {
                headline: 'Special Offer Just For You',
                bullets: ['Benefit 1', 'Benefit 2', 'Benefit 3'],
                offerText: 'Get 50% OFF today only!',
                ctaText: 'Claim Your Discount',
                ctaUrl: '',
                guaranteeText: '90-day money-back guarantee',
            };
        default:
            return { headline: '' };
    }
}

export default function QuizBuilder({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddSlideOpen, setIsAddSlideOpen] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    const fetchQuiz = async () => {
        try {
            const res = await fetch(`/api/quizzes/${id}`);
            if (res.ok) {
                const data = await res.json();
                // Transform slides to include id if missing
                const slides = (data.slides || []).map((s: any, i: number) => ({
                    id: s.id || generateId(),
                    type: s.type,
                    content: s.content,
                    conditionalLogic: s.conditional_logic || null,
                }));
                setQuiz({ ...data, slides });
            } else if (res.status === 404) {
                toast.error('Quiz not found');
                router.push('/admin/quizzes');
            }
        } catch (e) {
            toast.error('Failed to load quiz');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!quiz) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/quizzes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: quiz.name,
                    slug: quiz.slug,
                    description: quiz.description,
                    settings: quiz.settings,
                    status: quiz.status,
                    slides: quiz.slides,
                }),
            });

            if (res.ok) {
                toast.success('Quiz saved!');
            } else {
                toast.error('Failed to save quiz');
            }
        } catch (e) {
            toast.error('Failed to save quiz');
        } finally {
            setIsSaving(false);
        }
    };

    const addSlide = (type: Slide['type']) => {
        if (!quiz) return;
        const newSlide: Slide = {
            id: generateId(),
            type,
            content: getDefaultContent(type),
        };
        const newSlides = [...quiz.slides, newSlide];
        setQuiz({ ...quiz, slides: newSlides });
        setSelectedSlideIndex(newSlides.length - 1);
        setIsAddSlideOpen(false);
    };

    const duplicateSlide = (index: number) => {
        if (!quiz) return;
        const slide = quiz.slides[index];
        const newSlide: Slide = {
            ...slide,
            id: generateId(),
            content: { ...slide.content },
        };
        const newSlides = [...quiz.slides];
        newSlides.splice(index + 1, 0, newSlide);
        setQuiz({ ...quiz, slides: newSlides });
        setSelectedSlideIndex(index + 1);
    };

    const deleteSlide = (index: number) => {
        if (!quiz || quiz.slides.length <= 1) return;
        const newSlides = quiz.slides.filter((_, i) => i !== index);
        setQuiz({ ...quiz, slides: newSlides });
        if (selectedSlideIndex >= newSlides.length) {
            setSelectedSlideIndex(newSlides.length - 1);
        }
    };

    const moveSlide = (index: number, direction: 'up' | 'down') => {
        if (!quiz) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= quiz.slides.length) return;
        
        const newSlides = [...quiz.slides];
        [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
        setQuiz({ ...quiz, slides: newSlides });
        setSelectedSlideIndex(newIndex);
    };

    const updateSlideContent = (key: string, value: any) => {
        if (!quiz) return;
        const newSlides = [...quiz.slides];
        newSlides[selectedSlideIndex] = {
            ...newSlides[selectedSlideIndex],
            content: {
                ...newSlides[selectedSlideIndex].content,
                [key]: value,
            },
        };
        setQuiz({ ...quiz, slides: newSlides });
    };

    const updateOption = (optionIndex: number, key: string, value: any) => {
        if (!quiz) return;
        const options = [...(quiz.slides[selectedSlideIndex].content.options || [])];
        options[optionIndex] = { ...options[optionIndex], [key]: value };
        updateSlideContent('options', options);
    };

    const addOption = () => {
        if (!quiz) return;
        const options = [...(quiz.slides[selectedSlideIndex].content.options || [])];
        options.push({ id: generateId(), text: `Option ${options.length + 1}` });
        updateSlideContent('options', options);
    };

    const removeOption = (optionIndex: number) => {
        if (!quiz) return;
        const options = quiz.slides[selectedSlideIndex].content.options?.filter((_, i) => i !== optionIndex);
        updateSlideContent('options', options);
    };

    // Drag and drop handlers
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!over || active.id === over.id || !quiz) return;
        
        const oldIndex = quiz.slides.findIndex(s => s.id === active.id);
        const newIndex = quiz.slides.findIndex(s => s.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newSlides = arrayMove(quiz.slides, oldIndex, newIndex);
            setQuiz({ ...quiz, slides: newSlides });
            
            // Update selected slide index if needed
            if (selectedSlideIndex === oldIndex) {
                setSelectedSlideIndex(newIndex);
            } else if (selectedSlideIndex > oldIndex && selectedSlideIndex <= newIndex) {
                setSelectedSlideIndex(selectedSlideIndex - 1);
            } else if (selectedSlideIndex < oldIndex && selectedSlideIndex >= newIndex) {
                setSelectedSlideIndex(selectedSlideIndex + 1);
            }
        }
    };

    const selectedSlide = quiz?.slides[selectedSlideIndex];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!quiz) {
        return null;
    }

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col">
            {/* Top Toolbar */}
            <div className="sticky top-0 z-50 bg-background border-b">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/quizzes" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <Input
                            value={quiz.name}
                            onChange={(e) => setQuiz({ ...quiz, name: e.target.value })}
                            className="font-medium border-none bg-transparent h-8 px-2 w-auto max-w-[300px] focus-visible:ring-1"
                        />
                        <Badge variant={quiz.status === 'published' ? 'default' : 'secondary'}>
                            {quiz.status}
                        </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Preview Mode Toggle */}
                        <div className="flex items-center bg-muted rounded-lg p-1">
                            <Button
                                variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setPreviewMode('mobile')}
                                className="h-8 px-3"
                            >
                                <Smartphone className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setPreviewMode('desktop')}
                                className="h-8 px-3"
                            >
                                <Monitor className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </Button>

                        {quiz.status === 'published' && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/quiz/${quiz.slug}`} target="_blank">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                </Link>
                            </Button>
                        )}

                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Slides */}
                <div className="w-64 bg-background border-r flex flex-col">
                    <div className="p-4 border-b">
                        <Button onClick={() => setIsAddSlideOpen(true)} className="w-full" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Slide
                        </Button>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={quiz.slides.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {quiz.slides.map((slide, index) => (
                                        <SortableSlideItem
                                            key={slide.id}
                                            slide={slide}
                                            index={index}
                                            isSelected={selectedSlideIndex === index}
                                            onSelect={() => setSelectedSlideIndex(index)}
                                            onDuplicate={() => duplicateSlide(index)}
                                            onDelete={() => deleteSlide(index)}
                                            canDelete={quiz.slides.length > 1}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </ScrollArea>
                </div>

                {/* Center - Phone Preview */}
                <div className="flex-1 flex items-center justify-center p-8 bg-muted/50">
                    <div className={cn(
                        'bg-white rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-300',
                        previewMode === 'mobile'
                            ? 'w-[375px]'
                            : 'w-full max-w-2xl rounded-xl'
                    )}>
                        {previewMode === 'mobile' && (
                            <div className="bg-black h-6 flex items-center justify-center">
                                <div className="w-20 h-4 bg-black rounded-full" />
                            </div>
                        )}
                        <div className={cn(
                            'overflow-y-auto',
                            previewMode === 'mobile' ? 'h-[700px]' : 'h-[600px]'
                        )}>
                            <SlidePreview
                                slide={selectedSlide}
                                quiz={quiz}
                                onContentChange={updateSlideContent}
                                onOptionChange={updateOption}
                            />
                        </div>
                        {previewMode === 'mobile' && (
                            <div className="bg-black h-5 flex items-center justify-center">
                                <div className="w-32 h-1 bg-gray-600 rounded-full" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Properties */}
                <div className="w-80 bg-background border-l flex flex-col">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold">Slide Properties</h3>
                        <p className="text-sm text-muted-foreground">
                            {SLIDE_TYPES.find(t => t.value === selectedSlide?.type)?.label || 'Select a slide'}
                        </p>
                    </div>
                    <ScrollArea className="flex-1">
                        {selectedSlide && (
                            <SlidePropertiesPanel
                                slide={selectedSlide}
                                onContentChange={updateSlideContent}
                                onOptionChange={updateOption}
                                onAddOption={addOption}
                                onRemoveOption={removeOption}
                            />
                        )}
                    </ScrollArea>
                </div>
            </div>

            {/* Add Slide Dialog */}
            <Dialog open={isAddSlideOpen} onOpenChange={setIsAddSlideOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Slide</DialogTitle>
                        <DialogDescription>Choose a slide type to add to your quiz.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-4">
                        {SLIDE_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => addSlide(type.value as Slide['type'])}
                                    className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary hover:bg-accent transition-colors text-left"
                                >
                                    <Icon className="h-6 w-6 text-primary" />
                                    <div className="text-center">
                                        <p className="font-medium text-sm">{type.label}</p>
                                        <p className="text-xs text-muted-foreground">{type.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Quiz Settings</DialogTitle>
                        <DialogDescription>Configure your quiz settings and publishing status.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Quiz Name</Label>
                            <Input
                                value={quiz.name}
                                onChange={(e) => setQuiz({ ...quiz, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL Slug</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">/quiz/</span>
                                <Input
                                    value={quiz.slug}
                                    onChange={(e) => setQuiz({ ...quiz, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={quiz.status}
                                onValueChange={(value) => setQuiz({ ...quiz, status: value as Quiz['status'] })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={quiz.settings.primaryColor}
                                    onChange={(e) => setQuiz({
                                        ...quiz,
                                        settings: { ...quiz.settings, primaryColor: e.target.value }
                                    })}
                                    className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={quiz.settings.primaryColor}
                                    onChange={(e) => setQuiz({
                                        ...quiz,
                                        settings: { ...quiz.settings, primaryColor: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper function to upload image to Supabase Storage
async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        
        if (!res.ok) {
            throw new Error('Upload failed');
        }
        
        const data = await res.json();
        return data.url;
    } catch (error) {
        console.error('Image upload error:', error);
        return null;
    }
}

// Slide Preview Component
function SlidePreview({
    slide,
    quiz,
    onContentChange,
    onOptionChange,
}: {
    slide?: Slide;
    quiz: Quiz;
    onContentChange: (key: string, value: any) => void;
    onOptionChange: (index: number, key: string, value: any) => void;
}) {
    if (!slide) return null;

    const primaryColor = quiz.settings.primaryColor;

    return (
        <div className="min-h-full p-6" style={{ backgroundColor: quiz.settings.backgroundColor }}>
            {/* Progress Bar */}
            {quiz.settings.showProgressBar && (
                <div className="mb-6">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all"
                            style={{
                                width: `${((quiz.slides.findIndex(s => s.id === slide.id) + 1) / quiz.slides.length) * 100}%`,
                                backgroundColor: primaryColor,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Headline - Inline Editable */}
            {slide.content.headline !== undefined && (
                <h1
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onContentChange('headline', e.currentTarget.textContent || '')}
                    className="text-2xl font-bold text-gray-900 mb-3 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 rounded px-1 -mx-1 cursor-text hover:bg-gray-50 transition-colors"
                    title="Click to edit headline"
                >
                    {slide.content.headline || 'Add headline...'}
                </h1>
            )}

            {/* Subheadline - Inline Editable */}
            {slide.content.subheadline !== undefined && (
                <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onContentChange('subheadline', e.currentTarget.textContent || '')}
                    className="text-gray-600 mb-6 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 rounded px-1 -mx-1 cursor-text hover:bg-gray-50 transition-colors"
                    title="Click to edit subheadline"
                >
                    {slide.content.subheadline || 'Add a subheadline...'}
                </p>
            )}

            {/* Legacy Body - for info slides without blocks */}
            {slide.content.body !== undefined && !slide.content.blocks && (
                <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onContentChange('body', e.currentTarget.textContent || '')}
                    className="text-gray-700 leading-relaxed mb-6 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 rounded px-1 -mx-1 whitespace-pre-wrap cursor-text hover:bg-gray-50 transition-colors"
                    title="Click to edit body text"
                >
                    {slide.content.body || 'Add body text...'}
                </div>
            )}

            {/* Content Blocks - for info slides */}
            {slide.type === 'info' && slide.content.blocks && (
                <div className="space-y-4 mb-6">
                    {slide.content.blocks.map((block, blockIndex) => (
                        <div key={block.id} className="group/block relative">
                            {block.type === 'heading' && (
                                <h2
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        const blocks = [...(slide.content.blocks || [])];
                                        blocks[blockIndex] = { ...blocks[blockIndex], content: e.currentTarget.textContent || '' };
                                        onContentChange('blocks', blocks);
                                    }}
                                    className="text-xl font-bold text-gray-900 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 rounded px-1 -mx-1 cursor-text hover:bg-gray-50 transition-colors"
                                >
                                    {block.content || 'Add heading...'}
                                </h2>
                            )}
                            {block.type === 'paragraph' && (
                                <p
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        const blocks = [...(slide.content.blocks || [])];
                                        blocks[blockIndex] = { ...blocks[blockIndex], content: e.currentTarget.textContent || '' };
                                        onContentChange('blocks', blocks);
                                    }}
                                    className="text-gray-700 leading-relaxed outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 rounded px-1 -mx-1 whitespace-pre-wrap cursor-text hover:bg-gray-50 transition-colors"
                                >
                                    {block.content || 'Add paragraph...'}
                                </p>
                            )}
                            {block.type === 'image' && (
                                <label className="block rounded-lg overflow-hidden cursor-pointer relative">
                                    {block.content ? (
                                        <>
                                            <img src={block.content} alt="" className="w-full h-40 object-cover rounded-lg" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <span className="text-white font-medium text-sm flex items-center gap-2">
                                                    <Upload className="h-4 w-4" />
                                                    Replace
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-32 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/50 transition-colors">
                                            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                                            <span className="text-xs text-muted-foreground">Click to add</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = await uploadImage(file);
                                                if (url) {
                                                    const blocks = [...(slide.content.blocks || [])];
                                                    blocks[blockIndex] = { ...blocks[blockIndex], content: url };
                                                    onContentChange('blocks', blocks);
                                                }
                                            }
                                        }}
                                    />
                                </label>
                            )}
                            {block.type === 'quote' && (
                                <div className="border-l-4 pl-4 py-2" style={{ borderColor: primaryColor }}>
                                    <p
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const blocks = [...(slide.content.blocks || [])];
                                            blocks[blockIndex] = { ...blocks[blockIndex], content: e.currentTarget.textContent || '' };
                                            onContentChange('blocks', blocks);
                                        }}
                                        className="text-gray-700 italic outline-none focus:bg-blue-50 rounded cursor-text hover:bg-gray-50 transition-colors"
                                    >
                                        {block.content || 'Add quote...'}
                                    </p>
                                    {block.author !== undefined && (
                                        <p
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const blocks = [...(slide.content.blocks || [])];
                                                blocks[blockIndex] = { ...blocks[blockIndex], author: e.currentTarget.textContent || '' };
                                                onContentChange('blocks', blocks);
                                            }}
                                            className="text-sm text-gray-500 mt-1 outline-none focus:bg-blue-50 rounded cursor-text"
                                        >
                                            — {block.author || 'Author name'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Image - Click to replace (for results slides) */}
            {slide.type === 'results' && (
                <label className="mb-6 block rounded-lg overflow-hidden cursor-pointer group relative">
                    {slide.content.imageUrl ? (
                        <>
                            <img src={slide.content.imageUrl} alt="" className="w-full h-48 object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-medium text-sm flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Click to replace
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-32 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/50 transition-colors">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                            <span className="text-sm text-muted-foreground">Click to add image</span>
                        </div>
                    )}
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const url = await uploadImage(file);
                                if (url) onContentChange('imageUrl', url);
                            }
                        }}
                    />
                </label>
            )}

            {/* Options - for choice slides */}
            {slide.content.options && (
                <div className={cn(
                    "mb-6",
                    slide.type === 'image-choice' 
                        ? slide.content.options.length === 4 
                            ? "grid grid-cols-2 gap-3" 
                            : "grid grid-cols-3 gap-2"
                        : "space-y-3"
                )}>
                    {slide.content.options.map((option, index) => (
                        <button
                            key={option.id}
                            className={cn(
                                "text-left border-2 rounded-xl transition-all hover:border-gray-400 group relative",
                                slide.type === 'image-choice' 
                                    ? "p-2 flex flex-col" 
                                    : "w-full p-4"
                            )}
                            style={{ borderColor: '#e5e7eb' }}
                        >
                            {slide.type === 'image-choice' && (
                                <div className="aspect-square w-full rounded-lg overflow-hidden mb-2 bg-muted">
                                    {option.imageUrl ? (
                                        <img src={option.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                    )}
                                </div>
                            )}
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => onOptionChange(index, 'text', e.currentTarget.textContent || '')}
                                className={cn(
                                    "font-medium outline-none focus:bg-blue-50 rounded",
                                    slide.type === 'image-choice' && "text-sm text-center block"
                                )}
                            >
                                {option.text}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Loading Items */}
            {slide.type === 'loading' && slide.content.items && (
                <div className="space-y-4">
                    {slide.content.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" style={{ color: primaryColor }} />
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                    const items = [...(slide.content.items || [])];
                                    items[index] = { ...items[index], text: e.currentTarget.textContent || '' };
                                    onContentChange('items', items);
                                }}
                                className="text-gray-700 outline-none focus:bg-blue-50 rounded"
                            >
                                {item.text}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Bullets - for offer slides */}
            {slide.content.bullets && (
                <div className="space-y-2 mb-6">
                    {slide.content.bullets.map((bullet, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <span style={{ color: primaryColor }}>✓</span>
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                    const bullets = [...(slide.content.bullets || [])];
                                    bullets[index] = e.currentTarget.textContent || '';
                                    onContentChange('bullets', bullets);
                                }}
                                className="text-gray-700 outline-none focus:bg-blue-50 rounded"
                            >
                                {bullet}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Offer Text */}
            {slide.content.offerText && (
                <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onContentChange('offerText', e.currentTarget.textContent || '')}
                    className="text-center text-lg font-semibold mb-4 p-4 rounded-lg outline-none focus:bg-blue-50"
                    style={{ backgroundColor: `${primaryColor}15` }}
                >
                    {slide.content.offerText}
                </div>
            )}

            {/* Button Text */}
            {slide.content.buttonText && (
                <button
                    className="w-full py-3 px-6 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                >
                    <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => onContentChange('buttonText', e.currentTarget.textContent || '')}
                        className="outline-none"
                    >
                        {slide.content.buttonText}
                    </span>
                </button>
            )}

            {/* CTA Button */}
            {slide.content.ctaText && (
                <button
                    className="w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: primaryColor }}
                >
                    <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => onContentChange('ctaText', e.currentTarget.textContent || '')}
                        className="outline-none"
                    >
                        {slide.content.ctaText}
                    </span>
                </button>
            )}

            {/* Guarantee Text */}
            {slide.content.guaranteeText && (
                <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onContentChange('guaranteeText', e.currentTarget.textContent || '')}
                    className="text-center text-sm text-gray-500 mt-4 outline-none focus:bg-blue-50 rounded"
                >
                    {slide.content.guaranteeText}
                </p>
            )}
        </div>
    );
}

// Slide Properties Panel Component
function SlidePropertiesPanel({
    slide,
    onContentChange,
    onOptionChange,
    onAddOption,
    onRemoveOption,
}: {
    slide: Slide;
    onContentChange: (key: string, value: any) => void;
    onOptionChange: (index: number, key: string, value: any) => void;
    onAddOption: () => void;
    onRemoveOption: (index: number) => void;
}) {
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);
    
    const handleImageUpload = async (key: string, file: File) => {
        setUploadingImage(key);
        const url = await uploadImage(file);
        if (url) {
            onContentChange(key, url);
        } else {
            toast.error('Failed to upload image');
        }
        setUploadingImage(null);
    };
    
    const handleOptionImageUpload = async (index: number, file: File) => {
        setUploadingImage(`option-${index}`);
        const url = await uploadImage(file);
        if (url) {
            onOptionChange(index, 'imageUrl', url);
        } else {
            toast.error('Failed to upload image');
        }
        setUploadingImage(null);
    };

    const addBlock = (type: ContentBlock['type']) => {
        const blocks = [...(slide.content.blocks || [])];
        const newBlock: ContentBlock = {
            id: Math.random().toString(36).substring(2, 9),
            type,
            content: '',
            ...(type === 'quote' ? { author: '' } : {}),
        };
        blocks.push(newBlock);
        onContentChange('blocks', blocks);
    };

    const removeBlock = (blockIndex: number) => {
        const blocks = slide.content.blocks?.filter((_, i) => i !== blockIndex);
        onContentChange('blocks', blocks);
    };

    const moveBlock = (blockIndex: number, direction: 'up' | 'down') => {
        const blocks = [...(slide.content.blocks || [])];
        const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
        if (newIndex < 0 || newIndex >= blocks.length) return;
        [blocks[blockIndex], blocks[newIndex]] = [blocks[newIndex], blocks[blockIndex]];
        onContentChange('blocks', blocks);
    };

    return (
        <div className="p-4 space-y-6">
            {/* Content Blocks for Info slides */}
            {slide.type === 'info' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Content Blocks</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => addBlock('heading')}>
                                    <Type className="mr-2 h-4 w-4" />
                                    Heading
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addBlock('paragraph')}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Paragraph
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addBlock('image')}>
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Image
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addBlock('quote')}>
                                    <Award className="mr-2 h-4 w-4" />
                                    Quote / Testimonial
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                    {(slide.content.blocks || []).map((block, blockIndex) => (
                        <div key={block.id} className="flex items-start gap-2 p-2 border rounded-lg bg-muted/30">
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => moveBlock(blockIndex, 'up')}
                                    disabled={blockIndex === 0}
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => moveBlock(blockIndex, 'down')}
                                    disabled={blockIndex === (slide.content.blocks?.length || 0) - 1}
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-muted-foreground capitalize">
                                        {block.type}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => removeBlock(blockIndex)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                {block.type === 'image' ? (
                                    block.content ? (
                                        <img src={block.content} alt="" className="w-full h-16 object-cover rounded" />
                                    ) : (
                                        <div className="text-xs text-muted-foreground">Click in preview to add</div>
                                    )
                                ) : (
                                    <p className="text-sm truncate">{block.content || '(empty)'}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {(!slide.content.blocks || slide.content.blocks.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No content blocks yet. Add one above.
                        </p>
                    )}
                </div>
            )}

            {/* Image Upload for results slides */}
            {slide.type === 'results' && (
                <div className="space-y-2">
                    <Label>Slide Image</Label>
                    {slide.content.imageUrl ? (
                        <div className="relative">
                            <img src={slide.content.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => onContentChange('imageUrl', '')}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <label className={cn(
                            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                            uploadingImage === 'imageUrl' && "opacity-50 cursor-not-allowed"
                        )}>
                            {uploadingImage === 'imageUrl' ? (
                                <>
                                    <Loader2 className="h-6 w-6 text-muted-foreground mb-2 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Upload Image</span>
                                </>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                disabled={uploadingImage === 'imageUrl'}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload('imageUrl', file);
                                }}
                            />
                        </label>
                    )}
                </div>
            )}

            {/* Options Editor for choice slides */}
            {slide.content.options && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button variant="ghost" size="sm" onClick={onAddOption}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    </div>
                    {slide.content.options.map((option, index) => (
                        <div key={option.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={option.text}
                                    onChange={(e) => onOptionChange(index, 'text', e.target.value)}
                                    className="flex-1"
                                />
                                {slide.type === 'image-choice' && (
                                    <label className={cn(
                                        "cursor-pointer p-2 rounded hover:bg-accent",
                                        uploadingImage === `option-${index}` && "opacity-50"
                                    )}>
                                        {uploadingImage === `option-${index}` ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ImageIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            disabled={uploadingImage === `option-${index}`}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleOptionImageUpload(index, file);
                                            }}
                                        />
                                    </label>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => onRemoveOption(index)}
                                    disabled={slide.content.options!.length <= 2}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            {/* Show image preview for image-choice */}
                            {slide.type === 'image-choice' && option.imageUrl && (
                                <div className="relative ml-0">
                                    <img 
                                        src={option.imageUrl} 
                                        alt={option.text} 
                                        className="w-full h-20 object-cover rounded-lg border"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-5 w-5"
                                        onClick={() => onOptionChange(index, 'imageUrl', '')}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            {/* Category for scoring */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-16 shrink-0">Category:</span>
                                <Input
                                    value={option.category || ''}
                                    onChange={(e) => onOptionChange(index, 'category', e.target.value)}
                                    placeholder="e.g., Type A"
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Results Categories Editor */}
            {slide.type === 'results' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Result Categories</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const categories = [...(slide.content.resultCategories || [])];
                                categories.push({
                                    id: Math.random().toString(36).substring(2, 9),
                                    name: `Category ${categories.length + 1}`,
                                    headline: 'Result Headline',
                                    body: 'Result description...',
                                });
                                onContentChange('resultCategories', categories);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Assign categories to quiz options. The category with the most selections wins.
                    </p>
                    {(slide.content.resultCategories || []).map((category, catIndex) => (
                        <div key={category.id} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between">
                                <Input
                                    value={category.name}
                                    onChange={(e) => {
                                        const cats = [...(slide.content.resultCategories || [])];
                                        cats[catIndex] = { ...cats[catIndex], name: e.target.value };
                                        onContentChange('resultCategories', cats);
                                    }}
                                    placeholder="Category Name"
                                    className="h-7 text-sm font-medium w-32"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                        const cats = slide.content.resultCategories?.filter((_, i) => i !== catIndex);
                                        onContentChange('resultCategories', cats);
                                    }}
                                    disabled={(slide.content.resultCategories?.length || 0) <= 1}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <Input
                                value={category.headline}
                                onChange={(e) => {
                                    const cats = [...(slide.content.resultCategories || [])];
                                    cats[catIndex] = { ...cats[catIndex], headline: e.target.value };
                                    onContentChange('resultCategories', cats);
                                }}
                                placeholder="Headline for this result"
                                className="text-sm"
                            />
                            <Textarea
                                value={category.body}
                                onChange={(e) => {
                                    const cats = [...(slide.content.resultCategories || [])];
                                    cats[catIndex] = { ...cats[catIndex], body: e.target.value };
                                    onContentChange('resultCategories', cats);
                                }}
                                placeholder="Description for this result..."
                                rows={2}
                                className="text-sm"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Loading Items Editor */}
            {slide.type === 'loading' && slide.content.items && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Loading Steps</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const items = [...(slide.content.items || [])];
                                items.push({ text: 'New step...', duration: 2000 });
                                onContentChange('items', items);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    </div>
                    {slide.content.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                value={item.text}
                                onChange={(e) => {
                                    const items = [...(slide.content.items || [])];
                                    items[index] = { ...items[index], text: e.target.value };
                                    onContentChange('items', items);
                                }}
                                className="flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    const items = slide.content.items?.filter((_, i) => i !== index);
                                    onContentChange('items', items);
                                }}
                                disabled={(slide.content.items?.length || 0) <= 1}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Bullets Editor for Offer slides */}
            {slide.content.bullets && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Benefits/Bullets</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const bullets = [...(slide.content.bullets || [])];
                                bullets.push('New benefit');
                                onContentChange('bullets', bullets);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    </div>
                    {slide.content.bullets.map((bullet, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                value={bullet}
                                onChange={(e) => {
                                    const bullets = [...(slide.content.bullets || [])];
                                    bullets[index] = e.target.value;
                                    onContentChange('bullets', bullets);
                                }}
                                className="flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    const bullets = slide.content.bullets?.filter((_, i) => i !== index);
                                    onContentChange('bullets', bullets);
                                }}
                                disabled={(slide.content.bullets?.length || 0) <= 1}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* CTA URL for Offer slides */}
            {slide.type === 'offer' && (
                <div className="space-y-2">
                    <Label>CTA Link URL</Label>
                    <Input
                        value={slide.content.ctaUrl || ''}
                        onChange={(e) => onContentChange('ctaUrl', e.target.value)}
                        placeholder="https://..."
                    />
                </div>
            )}
        </div>
    );
}

