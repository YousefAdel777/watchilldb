export interface Movie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    original_language: string;
}

export interface Genre {
    id: number;
    name: string;
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

export interface Review {
    id: string;
    author: string;
    content: string;
    created_at: string;
    author_details: {
        rating: number | null;
        avatar_path: string | null;
    };
}

export interface MovieDetails extends Movie {
    genres: Genre[];
    runtime: number;
    tagline: string;
    status: string;
    revenue: number;
    budget: number;
    production_countries: { name: string; iso_3166_1: string }[];
    spoken_languages: { name: string; english_name: string; iso_639_1: string }[];
}

export interface TMDBResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}
