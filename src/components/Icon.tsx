import { Sparkles, Globe2, Layers3, FileText, Check, ArrowRight, Play, Hand, ShieldCheck } from 'lucide-react';
const icons = { sparkles: Sparkles, globe: Globe2, layers: Layers3, file: FileText, check: Check, arrow: ArrowRight, play: Play, hand: Hand, shield: ShieldCheck };
export function Icon({ name, size = 24 }: { name: keyof typeof icons; size?: number }) { const Component = icons[name]; return <Component size={size} strokeWidth={1.7} aria-hidden="true" />; }
