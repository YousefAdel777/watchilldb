import axios from 'axios';
import { TMDBResponse, Movie, Genre, MovieDetails, CastMember, Review } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY;

const tmdb = axios.create({
    baseURL: TMDB_BASE_URL,
    headers: {
        "Authorization": "Bearer " + API_KEY
    }
});

export const tmdbService = {
    getPopularMovies: async (page = 1) => {
        const { data } = await tmdb.get<TMDBResponse<Movie>>('/movie/popular', {
            params: { page, include_adult: false },
        });
        return data;
    },

    getTrendingMovies: async () => {
        const { data } = await tmdb.get<TMDBResponse<Movie>>('/trending/movie/day', {
            params: { include_adult: false }
        });
        return data;
    },

    searchMovies: async (query: string, page = 1) => {
        const { data } = await tmdb.get<TMDBResponse<Movie>>('/search/movie', {
            params: { query, page, include_adult: false },
        });
        return data;
    },

    getGenres: async () => {
        const { data } = await tmdb.get<{ genres: Genre[] }>('/genre/movie/list');
        return data.genres;
    },

    getMoviesByGenre: async (genreId: number, page = 1) => {
        const { data } = await tmdb.get<TMDBResponse<Movie>>('/discover/movie', {
            params: { with_genres: genreId, page, include_adult: false },
        });
        return data;
    },

    getMovieDetails: async (id: string) => {
        const { data } = await tmdb.get<MovieDetails>(`/movie/${id}`);
        return data;
    },

    getMovieCredits: async (id: string) => {
        const { data } = await tmdb.get<{ cast: CastMember[] }>(`/movie/${id}/credits`);
        return data.cast;
    },

    getMovieReviews: async (id: string, page = 1) => {
        const { data } = await tmdb.get<TMDBResponse<Review>>(`/movie/${id}/reviews`, {
            params: { page },
        });
        return data;
    },
    
    getImageUrl: (path: string | null, size: 'w500' | 'original' = 'w500') => {
        if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
        return `https://image.tmdb.org/t/p/${size}${path}`;
    }
};
