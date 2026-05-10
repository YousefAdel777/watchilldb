import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "../../services/tmdb";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GenreFilterProps {
    selectedGenre: number | null;
    onGenreSelect: (id: number | null) => void;
}

export default function GenreFilter({ selectedGenre, onGenreSelect }: GenreFilterProps) {

    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);
    const { data: genres } = useQuery({
        queryKey: ["genres"],
        queryFn: tmdbService.getGenres,
    });

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === "left" ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    const handleScroll = () => {
        const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
        if (scrollLeft === 0) {
            setShowLeft(false);
        }
        else {
            setShowLeft(true);
        }
        if (scrollLeft + clientWidth >= scrollWidth) {
            setShowRight(false);
        }
        else {
            setShowRight(true);
        }
    }

    return (
        <div className="relative group/filter">
            {
                showLeft && 
                <button 
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover/filter:opacity-100 group-hover/filter:translate-x-0 transition-all shadow-2xl cursor-pointer"
                >
                    <ChevronLeft size={20} />
                </button>
            }

            <div 
                onScroll={handleScroll}
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth"
            >
                {/* <button
                    onClick={() => onGenreSelect(null)}
                    className={`shrink-0 px-6 cursor-pointer py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedGenre === null
                            ? "bg-white text-black"
                            : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                    }`}
                >
                    All
                </button> */}
                {genres?.map((genre) => (
                    <button
                        key={genre.id}
                        onClick={() => onGenreSelect(genre.id)}
                        className={`shrink-0 cursor-pointer px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            selectedGenre === genre.id
                                ? "bg-white text-black"
                                : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                        }`}
                    >
                        {genre.name}
                    </button>
                ))}
            </div>

            {
                showRight && 
                <button 
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover/filter:opacity-100 group-hover/filter:translate-x-0 transition-all shadow-2xl cursor-pointer"
                >
                    <ChevronRight size={20} />
                </button>
            }
        </div>
    );
}
