from pydantic import BaseModel, ConfigDict
from typing import Optional

class PredictRequest(BaseModel):
    movie_valence: Optional[float] = None
    movie_vad_valence: Optional[float]  = None
    movie_vad_arousal: Optional[float]  = None
    movie_vad_dominance: Optional[float] = None
    movie_intensity_anger: Optional[float]  = None
    movie_intensity_anticipation: Optional[float]  = None
    movie_intensity_disgust: Optional[float] = None
    movie_intensity_fear: Optional[float] = None
    movie_intensity_joy: Optional[float] = None
    movie_intensity_sadness: Optional[float]  = None
    movie_intensity_surprise: Optional[float]  = None
    movie_intensity_trust: Optional[float] = None
    movie_scl_shift: Optional[float] = None
    movie_scl_coverage: Optional[float] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    revenue: Optional[int] = None
    runtime: Optional[int] = None
    budget: Optional[int] = None
    # popularity: Optional[float] = None
    id: Optional[int]
    quality: Optional[str] = None
    status: Optional[str] = None
    original_language: Optional[str] = None
    adult: Optional[bool] = None
    theatrical: Optional[bool] = None
    title: Optional[str] = None
    original_title: Optional[str] = None
    imdb_id: Optional[str] = None
    overview: Optional[str] = None
    tagline: Optional[str] = None
    genres: Optional[str] = None
    production_companies: Optional[str] = None
    production_countries: Optional[str] = None
    spoken_languages: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    homepage: Optional[str] = None
    release_date: Optional[str] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)