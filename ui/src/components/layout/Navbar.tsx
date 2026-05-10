import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Film, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '../../services/tmdb';
import logo from "../../assets/logo.png";

export default function Navbar() {
    const [search, setSearch] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['live-search', search],
        queryFn: () => tmdbService.searchMovies(search),
        enabled: search.length > 2,
    });

    const showDropdown = isFocused && search.length > 2;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/?q=${encodeURIComponent(search.trim())}`);
            setSearch('');
            setIsFocused(false);
            setIsMenuOpen(false);
        }
    };

    const handleResultClick = (id: number) => {
        navigate(`/movie/${id}`);
        setSearch('');
        setIsFocused(false);
        setIsMenuOpen(false);
    };

    const NavLinks = ({ className = "" }: { className?: string }) => (
        <>
            <NavLink 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `${className} hover:text-white transition-colors ${isActive ? "text-white" : "text-slate-400"}`}
            >
                Movies
            </NavLink>
            <NavLink 
                to="/predict" 
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `${className} hover:text-white transition-colors ${isActive ? "text-white" : "text-slate-400"}`}
            >
                Predictions
            </NavLink>
        </>
    );

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass py-3 md:py-4">
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-3 md:gap-6">
                
                <Link to="/" className="flex items-center gap-2 group shrink-0">
                    <img className="h-7 md:h-10 transition-all" src={logo} alt="logo" />
                </Link>

                <div className="flex-1 max-w-md relative">
                    <form onSubmit={handleSearch}>
                        <div className="relative">
                            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                placeholder="Search..."
                                className="w-full bg-slate-800/70 border border-slate-700/60 rounded-full py-1.5 md:py-2 pl-9 md:pl-10 pr-8 md:pr-10 text-xs md:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => { setSearch(''); inputRef.current?.focus(); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </form>

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                ref={dropdownRef}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-[60]"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="w-5 h-5 border-2 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
                                    </div>
                                ) : searchResults?.results?.length ? (
                                    <div className="py-1.5">
                                        {searchResults.results.slice(0, 5).map((movie) => (
                                            <button
                                                key={movie.id}
                                                onClick={() => handleResultClick(movie.id)}
                                                className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left"
                                            >
                                                <div className="w-8 h-11 rounded bg-slate-800 shrink-0 overflow-hidden">
                                                    {movie.poster_path && (
                                                        <img src={tmdbService.getImageUrl(movie.poster_path)} className="w-full h-full object-cover" alt="" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-semibold text-white truncate">{movie.title}</span>
                                                    <span className="text-[10px] text-slate-500">{movie.vote_average.toFixed(1)} ★</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-4 text-center text-xs text-slate-500">No movies found</div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm font-medium shrink-0">
                    <NavLinks />
                </div>

                <div className="md:hidden flex items-center">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-slate-300 hover:text-white p-1"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-slate-900/95 border-t border-slate-800 mt-3 overflow-hidden"
                    >
                        <div className="flex flex-col p-4 gap-4 text-sm font-medium">
                            <NavLinks className="py-2" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}