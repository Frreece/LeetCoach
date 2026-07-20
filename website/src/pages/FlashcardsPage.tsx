import { useState, useMemo } from "react";
import { useFlashcards } from "../hooks/useFlashcards";
import { FlashCard } from "../data/cards";
import { Search, Filter, Plus } from "lucide-react"

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

export default function FlashcardsPage() {
  const { cards, srsMap, loading, error, addToQueue } = useFlashcards();

  // Filter state
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Main card state
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Derived filter options from cards
  const allCategories = useMemo(() =>
    [...new Set(cards.map(c => c.category))].sort(), [cards]);
  const allTags = useMemo(() => {
  const counts = new Map<string, number>();
  cards.forEach(card => {
    card.tags.forEach(tag => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag]) => tag);
}, [cards]);

  // Filtered cards
  const filtered = useMemo(() => {
    return cards.filter(card => {
      const matchSearch = !search ||
        card.front.toLowerCase().includes(search.toLowerCase()) ||
        card.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchDiff = diffFilter === "All" || card.difficulty === diffFilter;
      const matchCategory = categoryFilter.length === 0 || categoryFilter.includes(card.category);
      const matchTag = tagFilter.length === 0 || tagFilter.some(t => card.tags.includes(t));
      return matchSearch && matchDiff && matchCategory && matchTag;
    });
  }, [cards, search, diffFilter, categoryFilter, tagFilter]);

  const activeCard = filtered[activeIndex] ?? null;

  // Reset active card when filters change
  const handleSearch = (val: string) => { setSearch(val); setActiveIndex(0); setFlipped(false); };
  const handleDiff = (val: string) => { setDiffFilter(val); setActiveIndex(0); setFlipped(false); };
  
  const toggleCategory = (cat: string) => {
    setCategoryFilter(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setActiveIndex(0);
    setFlipped(false);
  };

  const toggleTag = (tag: string) => {
    setTagFilter(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setActiveIndex(0);
    setFlipped(false);
  };

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
    setFlipped(false);
    // scroll to top so main card is visible
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Queue button state per card
  const getQueueState = (cardId: string): "not-added" | "added" | "due" => {
    const srs = srsMap.get(cardId);
    if (!srs) return "not-added";
    if (new Date(srs.nextReview) <= new Date()) return "due";
    return "added";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Design Flashcards</h1>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9 text-sm w-full"
            placeholder="Search cards…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowFilters(f => !f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 $${
  showFilters
    ? "bg-slate-600/20 text-slate-300"
    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
}`}>
            <Filter size={14} className={showFilters ? "text-slate-500" : "text-slate-400"} />
          </button>
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => handleDiff(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                diffFilter === d
                  ? "bg-slate-600/20 text-slate-300"
    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {showFilters && <div className="flex items-center gap-2 flex-wrap">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter.includes(cat)
                  ? "bg-slate-600/20 text-slate-300"
    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>}

        
      </div>

      {loading && (
        <div className="space-y-2 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-slate-800 rounded-xl" />)}
        </div>
      )}

      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          <div className="text-xs text-slate-500">{filtered.length} card{filtered.length !== 1 ? "s" : ""}</div>

          {/* Main Card */}
          {activeCard ? (
            <div className="space-y-3">
              {/* Flippable Card */}
              <div
  onClick={() => setFlipped(f => !f)}
  className="card p-0 min-h-[480px] flex flex-col cursor-pointer hover:bg-slate-800/60 transition-colors relative overflow-hidden"
>
  {/* Top bar */}
  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">{activeCard.category}</span>
      <span className="text-slate-700">•</span>
      <DiffBadge diff={activeCard.difficulty} />
    </div>
    <div onClick={e => e.stopPropagation()}>
      <QueueButton state={getQueueState(activeCard.id)} onAdd={() => addToQueue(activeCard.id)} />
    </div>
  </div>

  {/* Main content */}
  <div className="flex-1 flex items-center justify-center px-12 py-8">
    <p className="text-center text-slate-100 text-2xl font-medium leading-relaxed">
      {flipped ? activeCard.back : activeCard.front}
    </p>
  </div>

  {/* Bottom bar */}
  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
    <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">
      {flipped ? "Answer" : "Question"}
    </span>
    <span className="text-xs text-slate-600">click to flip</span>
  </div>
</div>
              <div className="flex items-center justify-center gap-6">
  <span className="text-sm text-slate-500">{activeIndex + 1} / {filtered.length}</span>
  <button
    onClick={() => { setActiveIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
    disabled={activeIndex === 0}
    className="px-6 py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors"
  >
    Prev
  </button>
  <button
    onClick={() => { setActiveIndex(i => Math.min(filtered.length - 1, i + 1)); setFlipped(false); }}
    disabled={activeIndex === filtered.length - 1}
    className="px-6 py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors"
  >
    Next
  </button>
</div>
            </div>
          ) : (
            <div className="card p-8 text-center text-slate-500">No cards match your filters.</div>
          )}

          {/* Card List */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Question</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Difficulty</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((card, i) => (
                  <tr
                    key={card.id}
                    onClick={() => handleCardClick(i)}
                    className={`border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors cursor-pointer ${
                      i === activeIndex ? "bg-slate-800/40" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5 text-slate-200">{card.front}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-400 text-xs">{card.category}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell"><DiffBadge diff={card.difficulty} /></td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <QueueButton state={getQueueState(card.id)} onAdd={() => addToQueue(card.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
function DiffBadge({ diff }: { diff: string }) {
  const cls =
    diff === "Easy" ? "badge-easy" :
    diff === "Medium" ? "badge-medium" :
    diff === "Hard" ? "badge-hard" : "hidden";
  return diff ? <span className={cls}>{diff}</span> : null;
}

function QueueButton({ state, onAdd }: { state: "not-added" | "added" | "due"; onAdd: () => void }) {
  if (state === "due") return <span className="text-xs text-brand-400 font-medium">Due for review</span>;
  if (state === "added") return <span className="text-xs text-slate-500">Added</span>;
  return (
    <button
      onClick={onAdd}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-brand-600/20 text-slate-400 hover:text-brand-300 border border-slate-700 hover:border-brand-600/40 transition-colors"
    >
      <Plus size={12} />
      Add to Queue
    </button>
  );
}


  