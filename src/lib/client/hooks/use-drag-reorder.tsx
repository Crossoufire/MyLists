import {useState, useCallback} from "react";


interface UseDragReorderOptions {
    onReorder: (fromIndex: number, toIndex: number) => void;
}


export function useDragReorder({ onReorder }: UseDragReorderOptions) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = useCallback((ev: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        ev.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragOver = useCallback((ev: React.DragEvent<HTMLDivElement>, index: number) => {
        ev.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    }, [draggedIndex]);

    const handleDragEnd = useCallback(() => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            onReorder(draggedIndex, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, [draggedIndex, dragOverIndex, onReorder]);

    const handleTouchStart = useCallback((index: number) => {
        setDraggedIndex(index);
    }, []);

    const handleTouchMove = useCallback((ev: React.TouchEvent<HTMLDivElement>) => {
        if (draggedIndex === null) return;

        const touch = ev.touches[0];
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
        const cardElement = elements.find((el) => (el as HTMLElement).dataset?.cardIndex);

        if (cardElement) {
            const newIndex = Number((cardElement as HTMLElement).dataset.cardIndex);
            if (newIndex !== draggedIndex) {
                setDragOverIndex(newIndex);
            }
        }
    }, [draggedIndex]);

    const handleTouchEnd = useCallback(() => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            onReorder(draggedIndex, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, [draggedIndex, dragOverIndex, onReorder]);

    return {
        draggedIndex,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    };
}