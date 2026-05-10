import React from 'react';
import { Movie } from '../../types';
import { tmdbService } from '../../services/tmdb';
import { Star, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MovieCardProps {
    movie: Movie;
    key?: React.Key | number;
}

export default function MovieCard({ movie }: MovieCardProps) {
    return (
        <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl transition-all cursor-pointer"
        >
            <Link to={`/movie/${movie.id}`}>
                <div className="aspect-2/3 relative overflow-hidden">
                <img
                    src={tmdbService.getImageUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to- from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <button className="bg-white text-black font-black py-2.5 rounded-xl text-xs uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 cursor-pointer">
                    Details
                    </button>
                </div>
                
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <div className="bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 shadow-lg">
                        <Star className="text-white fill-white" size={10} />
                            <span className="text-[10px] font-black text-white">{movie.vote_average.toFixed(1)}</span>
                        </div>
                        {movie.popularity > 1000 && (
                            <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 border border-white/30">
                                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                <span className="text-[8px] font-bold text-white uppercase tracking-widest">Trending</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-900">
                <h3 className="font-bold text-sm line-clamp-1 mb-1 group-hover:text-white transition-colors uppercase tracking-tight text-slate-200">
                    {movie.title}
                </h3>
                <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1 uppercase tracking-widest">
                    <Calendar size={10} />
                    {new Date(movie.release_date).getFullYear() || 'N/A'}
                    </span>
                </div>
                </div>
            </Link>
        </div>
    );
}
