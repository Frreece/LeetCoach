import { useState, useEffect, useCallback } from "react";
import { allCards, FlashCard } from "../data/cards";
import { api, SrsItemSD } from "../lib/api";

export function useFlashcards() {
    const [srsMap, setSrsMap] = useState<Map<string, SrsItemSD>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getFlashcardsSrs().then(({ items }) => {
            const map = new Map(items.map(item => [item.cardId, item]));
            setSrsMap(map);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }, []);

    const addToQueue = useCallback(async (cardId: string) => {
        await api.addToQueue(cardId);
        setSrsMap(prev => {
            const next = new Map(prev);
            next.set(cardId, {
                cardId,
                nextReview: new Date().toISOString(),
                interval: 0,
                easeFactor: 2.5,
                repetitions: 0,
            });
            return next;
        });
    }, []);

    const submitReview = useCallback(async (cardId: string, quality: number) => {
        const { srsData } = await api.submitFlashcardReview(cardId, quality);
        setSrsMap(prev => {
            const next = new Map(prev);
            next.set(cardId, srsData);
            return next;
        });
    }, []);

    return { cards: allCards, srsMap, loading, error, addToQueue, submitReview};
}