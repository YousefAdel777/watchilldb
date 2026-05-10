import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdb';
import MovieCard from '../components/movies/MovieCard';
import GenreFilter from '../components/movies/GenreFilter';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2 } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function Home() {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const [selectedGenre, setSelectedGenre] = useState<number | null>(12);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['movies', searchQuery, selectedGenre],
        queryFn: ({ pageParam = 1 }) => {
            if (searchQuery) return tmdbService.searchMovies(searchQuery, pageParam);
            if (selectedGenre) return tmdbService.getMoviesByGenre(selectedGenre, pageParam);
            return tmdbService.getPopularMovies(pageParam);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    });

    const movies = data?.pages.flatMap(page => page.results) || [];

    return (
        <div className="container max-w-7xl mx-auto px-8 pt-24 pb-12">
            <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">Discover</span>
                        <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tightest text-white leading-none">
                            {searchQuery ? `Results: ${searchQuery}` : 'WatChill Library'}
                        </h1>
                    </div>
                    {!searchQuery && (
                            <GenreFilter selectedGenre={selectedGenre} onGenreSelect={setSelectedGenre} />
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
                        ))}
                    </div>
                ) : movies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-700 gap-4">
                        <Search size={64} strokeWidth={1} />
                        <p className="text-xl font-medium uppercase tracking-widest">No entries found</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-12">
                        <InfiniteScroll
                            dataLength={movies.length}
                            next={fetchNextPage}
                            hasMore={!!hasNextPage}
                            loader={
                                <div className="h-24 flex items-center justify-center">
                                    <div className="flex items-center gap-3 text-white/40 uppercase font-black text-xs tracking-widest">
                                        <Loader2 className="animate-spin" size={16} />
                                    </div>
                                </div>
                            }
                            endMessage={
                                <div className="h-24 flex items-center justify-center">
                                    <div className="text-white/10 uppercase font-black text-xs tracking-widest">End of Library</div>
                                </div>
                            }
                        >
                            <motion.div 
                                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8"
                            >
                                <AnimatePresence mode="popLayout">
                                    {movies.map((movie, idx) => (
                                        <MovieCard key={`${movie.id}-${idx}`} movie={movie} />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </InfiniteScroll>
                    </div>
                )}
            </div>
        </div>
    );
}
