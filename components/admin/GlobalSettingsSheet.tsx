import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react';
import { useAdminSettings, Pixel, CtaUrl } from '@/hooks/useAdminSettings';

interface GlobalSettingsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function GlobalSettingsSheet({ open, onOpenChange }: GlobalSettingsSheetProps) {
    const { pixels, ctaUrls, isLoading, addPixel, updatePixel, deletePixel, addCtaUrl, updateCtaUrl, deleteCtaUrl } = useAdminSettings();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[500px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Global Settings</SheetTitle>
                    <SheetDescription>
                        Manage your tracking pixels and CTA URLs here.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    <Tabs defaultValue="pixels">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="pixels">Pixels</TabsTrigger>
                            <TabsTrigger value="cta-urls">CTA URLs</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="pixels" className="space-y-4 mt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">Tracking Pixels</h3>
                            </div>
                            <PixelList 
                                pixels={pixels} 
                                onAdd={addPixel} 
                                onUpdate={updatePixel} 
                                onDelete={deletePixel} 
                            />
                        </TabsContent>
                        
                        <TabsContent value="cta-urls" className="space-y-4 mt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">CTA URLs</h3>
                            </div>
                            <CtaUrlList 
                                urls={ctaUrls} 
                                onAdd={addCtaUrl} 
                                onUpdate={updateCtaUrl} 
                                onDelete={deleteCtaUrl} 
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function PixelList({ 
    pixels, 
    onAdd, 
    onUpdate, 
    onDelete 
}: { 
    pixels: Pixel[], 
    onAdd: (name: string, id: string) => Promise<any>, 
    onUpdate: (id: string, name: string, pixelId: string) => Promise<void>, 
    onDelete: (id: string) => Promise<void> 
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newId, setNewId] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!newName || !newId) return;
        await onAdd(newName, newId);
        setIsAdding(false);
        setNewName('');
        setNewId('');
    };

    return (
        <div className="space-y-3">
            {pixels.map(pixel => (
                <div key={pixel.id} className="group flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    {editingId === pixel.id ? (
                        <EditPixelForm 
                            pixel={pixel} 
                            onSave={async (name, id) => {
                                await onUpdate(pixel.id, name, id);
                                setEditingId(null);
                            }} 
                            onCancel={() => setEditingId(null)} 
                        />
                    ) : (
                        <>
                            <div>
                                <p className="font-medium text-sm">{pixel.name}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-1">{pixel.pixel_id}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(pixel.id)}>
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => onDelete(pixel.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {isAdding ? (
                <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs">Name</Label>
                        <Input 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)} 
                            placeholder="e.g. FB Main" 
                            className="h-8 text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Pixel ID</Label>
                        <Input 
                            value={newId} 
                            onChange={(e) => setNewId(e.target.value)} 
                            placeholder="123456789" 
                            className="h-8 text-sm font-mono"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAdd} disabled={!newName || !newId}>Save</Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Pixel
                </Button>
            )}
        </div>
    );
}

function EditPixelForm({ pixel, onSave, onCancel }: { pixel: Pixel, onSave: (name: string, id: string) => Promise<void>, onCancel: () => void }) {
    const [name, setName] = useState(pixel.name);
    const [id, setId] = useState(pixel.pixel_id);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(name, id);
        setSaving(false);
    };

    return (
        <div className="w-full space-y-3">
            <div className="space-y-2">
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Pixel ID</Label>
                <Input value={id} onChange={(e) => setId(e.target.value)} className="h-8 text-sm font-mono" />
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
            </div>
        </div>
    );
}

function CtaUrlList({ 
    urls, 
    onAdd, 
    onUpdate, 
    onDelete 
}: { 
    urls: CtaUrl[], 
    onAdd: (name: string, url: string) => Promise<any>, 
    onUpdate: (id: string, name: string, url: string) => Promise<void>, 
    onDelete: (id: string) => Promise<void> 
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!newName || !newUrl) return;
        await onAdd(newName, newUrl);
        setIsAdding(false);
        setNewName('');
        setNewUrl('');
    };

    return (
        <div className="space-y-3">
            {urls.map(url => (
                <div key={url.id} className="group flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    {editingId === url.id ? (
                        <EditCtaForm 
                            urlItem={url} 
                            onSave={async (name, val) => {
                                await onUpdate(url.id, name, val);
                                setEditingId(null);
                            }} 
                            onCancel={() => setEditingId(null)} 
                        />
                    ) : (
                        <>
                            <div className="min-w-0 flex-1 mr-4">
                                <p className="font-medium text-sm">{url.name}</p>
                                <p className="text-xs text-muted-foreground truncate mt-1">{url.url}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(url.id)}>
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => onDelete(url.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {isAdding ? (
                <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs">Name</Label>
                        <Input 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)} 
                            placeholder="e.g. Product Page" 
                            className="h-8 text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">URL</Label>
                        <Input 
                            value={newUrl} 
                            onChange={(e) => setNewUrl(e.target.value)} 
                            placeholder="https://..." 
                            className="h-8 text-sm"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAdd} disabled={!newName || !newUrl}>Save</Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add URL
                </Button>
            )}
        </div>
    );
}

function EditCtaForm({ urlItem, onSave, onCancel }: { urlItem: CtaUrl, onSave: (name: string, url: string) => Promise<void>, onCancel: () => void }) {
    const [name, setName] = useState(urlItem.name);
    const [url, setUrl] = useState(urlItem.url);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(name, url);
        setSaving(false);
    };

    return (
        <div className="w-full space-y-3">
            <div className="space-y-2">
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">URL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
            </div>
        </div>
    );
}

