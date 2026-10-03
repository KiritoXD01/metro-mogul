import type { FloatingText } from '../types';

export default function FloatingTexts({ items }: { items: FloatingText[] }) {
    return (
        <>
            {items.map((ft) => (
                <div
                    key={ft.id}
                    style={{ left: ft.x, top: ft.y }}
                    className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 animate-bounce text-2xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                >
                    {ft.text}
                </div>
            ))}
        </>
    );
}
