import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { tmdbService } from "../services/tmdb";
import {
    Star,
    Calendar,
    ArrowLeft,
    TrendingUp,
    User,
    Globe,
    MessageSquare,
    DollarSign,
    Loader2,
    ChevronRight,
    ChevronLeft
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useRef, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import MoviePopularityPrediction from "../components/movies/MoviePopularityPrediction";

export default function MovieDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const { data: movie, isLoading: movieLoading } = useQuery({
        queryKey: ["movie", id],
        queryFn: () => tmdbService.getMovieDetails(id!),
        enabled: !!id,
    });

    const { data: cast } = useQuery({
        queryKey: ["cast", id],
        queryFn: () => tmdbService.getMovieCredits(id!),
        enabled: !!id,
    });

    const {
        data: reviewsData,
        fetchNextPage,
        hasNextPage
    } = useInfiniteQuery({
        queryKey: ["reviews", id],
        queryFn: ({ pageParam = 1 }) => tmdbService.getMovieReviews(id!, pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages
                ? lastPage.page + 1
                : undefined,
        enabled: !!id,
    });

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        setShowRight(el.scrollWidth > el.clientWidth);
    }, [cast]);

    const handleScroll = () => {
        if (!scrollRef.current) return;

        const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;

        setShowLeft(scrollLeft > 0);
        setShowRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    const scroll = (dir: "left" | "right") => {
        scrollRef.current?.scrollBy({
            left: dir === "left" ? -260 : 260,
            behavior: "smooth",
        });
    };

    if (movieLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!movie) return null;

    const reviews =
        reviewsData?.pages.flatMap((page) => page.results) || [];

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(val);

    return (
        <div className="pb-20 bg-black min-h-screen overflow-hidden">
            <div className="relative h-[70vh] sm:h-[75vh] w-full">
                <div className="absolute inset-0">
                    <img
                        src={tmdbService.getImageUrl(
                            movie.backdrop_path,
                            "original"
                        )}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-10 sm:pb-14 z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-6 sm:top-10 left-4 sm:left-8 bg-white/10 backdrop-blur-md p-2.5 sm:p-3 rounded-full hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10"
                    >
                        <ArrowLeft size={18} />
                        <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">
                            Back
                        </span>
                    </button>

                    <div className="flex flex-col gap-5 sm:gap-8 w-full max-w-5xl">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <span className="px-3 py-1 bg-white rounded text-[10px] sm:text-[11px] font-black text-black uppercase tracking-widest">
                                    {movie.status}
                                </span>

                                <span className="px-3 py-1 bg-white/10 rounded text-[10px] sm:text-[11px] font-black text-white border border-white/10 uppercase tracking-widest">
                                    {movie.runtime} Min
                                </span>

                                {movie.genres.slice(0, 3).map((g) => (
                                    <span
                                        key={g.id}
                                        className="text-[10px] sm:text-[11px] font-black text-white/40 uppercase tracking-widest"
                                    >
                                        • {g.name}
                                    </span>
                                ))}
                            </div>

                            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight uppercase break-words">
                                {movie.title}
                            </h1>
                        </div>

                        {movie.tagline && (
                            <p className="text-sm sm:text-lg md:text-xl text-white/50 max-w-3xl font-medium leading-relaxed uppercase tracking-tight">
                                {movie.tagline}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                <div className="lg:col-span-8 flex flex-col gap-10 sm:gap-12 order-2 lg:order-1">
                    <section>
                        <h3 className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] mb-5 sm:mb-6 flex items-center gap-2">
                            <MessageSquare size={14} />
                            Storyline
                        </h3>

                        <p className="text-white/80 leading-7 sm:leading-relaxed text-base sm:text-lg font-medium">
                            {movie.overview}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] mb-5 sm:mb-6">
                            Top Cast
                        </h3>

                        <div className="relative">
                            {showLeft && (
                                <button
                                    onClick={() => scroll("left")}
                                    className="hidden cursor-pointer sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-slate-900 border border-white/10 items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            )}

                            {showRight && (
                                <button
                                    onClick={() => scroll("right")}
                                    className="hidden cursor-pointer sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-slate-900 border border-white/10 items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            )}

                            <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 no-scrollbar"
                            >
                                {cast?.slice(0, 15).map((person) => (
                                    <div
                                        key={person.id}
                                        className="shrink-0 w-20 sm:w-24 group cursor-pointer"
                                    >
                                        <div className="aspect-square rounded-full overflow-hidden mb-3 border-2 border-white/5 transition-all group-hover:border-white/40">
                                            {person.profile_path ? (
                                                <img
                                                    src={tmdbService.getImageUrl(
                                                        person.profile_path
                                                    )}
                                                    alt={person.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                    <User
                                                        className="text-white/20"
                                                        size={22}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="font-black text-[9px] sm:text-[10px] text-center line-clamp-1 uppercase">
                                            {person.name}
                                        </h4>

                                        <p className="text-[7px] sm:text-[8px] text-center font-bold text-white/30 uppercase tracking-tight mt-1 line-clamp-2">
                                            {person.character}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] mb-6">
                            Reviews
                        </h3>

                        <div className="flex flex-col gap-4">
                            {reviews.length === 0 ? (
                                <p className="text-white/20 font-black uppercase text-xs tracking-widest">
                                    No reviews.
                                </p>
                            ) : (
                                <InfiniteScroll
                                    dataLength={reviews.length}
                                    next={fetchNextPage}
                                    hasMore={!!hasNextPage}
                                    loader={
                                        <div className="h-20 flex items-center justify-center border-t border-white/5 mt-4">
                                            <Loader2
                                                className="animate-spin text-white/20"
                                                size={24}
                                            />
                                        </div>
                                    }
                                    endMessage={null}
                                >
                                    <div className="flex flex-col gap-4">
                                        {reviews.map((review, idx) => (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    x: -20,
                                                }}
                                                whileInView={{
                                                    opacity: 1,
                                                    x: 0,
                                                }}
                                                viewport={{ once: true }}
                                                key={`${review.id}-${idx}`}
                                                className="bg-white/5 border border-white/10 p-5 sm:p-8 rounded-2xl"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                            <User size={14} />
                                                        </div>

                                                        <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest truncate">
                                                            {review.author}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1 bg-white text-black px-2 py-1 rounded text-[10px] font-black tracking-tight w-fit">
                                                        <Star
                                                            size={10}
                                                            fill="currentColor"
                                                        />
                                                        {review.author_details
                                                            .rating || "?"}
                                                        /10
                                                    </div>
                                                </div>

                                                <p className="text-sm text-white/60 font-medium leading-relaxed break-words">
                                                    {review.content}
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </InfiniteScroll>
                            )}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 order-1 lg:order-2">
                    <div className="bg-white text-black rounded-[2rem] p-6 sm:p-10 flex flex-col items-center gap-6 text-center shadow-2xl">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">
                            Rating
                        </h3>

                        <div className="relative flex items-center justify-center">
                            <svg className="w-28 h-28 sm:w-32 sm:h-32 -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="50"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="opacity-10"
                                />

                                <circle
                                    cx="64"
                                    cy="64"
                                    r="50"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray="314"
                                    strokeDashoffset={
                                        314 -
                                        314 *
                                            (movie.vote_average * 0.1)
                                    }
                                    className="text-black"
                                />
                            </svg>

                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl sm:text-4xl font-black leading-none">
                                    {movie.vote_average.toFixed(1)}
                                </span>

                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">
                                    Rating
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Ratings
                            </span>

                            <span className="text-lg sm:text-xl font-black">
                                {movie.vote_count.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <MoviePopularityPrediction movie={movie} /> 
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 sm:p-8 flex flex-col gap-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase text-white/20 tracking-widest flex items-center gap-2">
                                    <Calendar size={12} />
                                    Release Date
                                </span>

                                <span className="text-sm font-black uppercase tracking-wide leading-relaxed">
                                    {new Date(
                                        movie.release_date
                                    ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase text-white/20 tracking-widest flex items-center gap-2">
                                    <Globe size={12} />
                                    Origin
                                </span>

                                <div className="flex flex-wrap gap-2">
                                    {movie.production_countries.map((c) => (
                                        <span
                                            key={c.iso_3166_1}
                                            className="text-sm font-black uppercase tracking-wide"
                                        >
                                            {c.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase text-white/20 tracking-widest flex items-center gap-2">
                                    <User size={12} />
                                    Primary Language
                                </span>

                                <span className="text-sm font-black uppercase tracking-wide">
                                    {movie.spoken_languages[0]
                                        ?.english_name || "English"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase text-white/20 tracking-widest flex items-center gap-2">
                                        <DollarSign size={12} />
                                        Budget
                                    </span>

                                    <span className="text-xs font-black uppercase break-words">
                                        {movie.budget > 0
                                            ? formatCurrency(movie.budget)
                                            : "N/A"}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase text-white/20 tracking-widest flex items-center gap-2">
                                        <TrendingUp size={12} />
                                        Revenue
                                    </span>

                                    <span className="text-xs font-black uppercase break-words">
                                        {movie.revenue > 0
                                            ? formatCurrency(movie.revenue)
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}