import pandas as pd
import json
import cloudpickle
import joblib
import numpy as np
from functools import lru_cache
import os
from sklearn.metrics import accuracy_score


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "..", "assets", "classification")

def load_pkl(filename):
    with open(os.path.join(ASSETS_DIR, filename), 'rb') as f:
        return cloudpickle.load(f)

class ClassificationController:
    def __init__(self):
        state_path = os.path.join(ASSETS_DIR, "master_pipeline_state.json")
        with open(state_path, 'r') as f:
            self.pipeline_state = json.load(f)

        self.text_imputers = {}
        self.numeric_imputers = {}
        for col in self.pipeline_state['cols_to_impute']['textual_cols']:
            pkl_path = os.path.join(ASSETS_DIR, f'{col}_imputer.pkl')
            with open(pkl_path, 'rb') as f:
                self.text_imputers[col] = cloudpickle.load(f)

        for col in self.pipeline_state['cols_to_impute']['numeric_cols']:
            pkl_path = os.path.join(ASSETS_DIR, f'{col}_imputer.pkl')
            with open(pkl_path, 'rb') as f:
                self.numeric_imputers[col] = cloudpickle.load(f)

        self.adult_imputer = joblib.load(os.path.join(ASSETS_DIR, 'adult_imputer.pkl'))
        self.multilabel_state = joblib.load(os.path.join(ASSETS_DIR, 'multilabel_state.joblib'))
        self.season_encoder = joblib.load(os.path.join(ASSETS_DIR, 'season_encoder.joblib'))
        self.coverage_binner = joblib.load(os.path.join(ASSETS_DIR, 'coverage_binner.joblib'))
        self.revenue_binner = joblib.load(os.path.join(ASSETS_DIR, 'revenue_binner.joblib'))
        self.scaling_state = joblib.load(os.path.join(ASSETS_DIR, 'scaling_state.joblib'))
        self.model = joblib.load(os.path.join(ASSETS_DIR, 'best_movie_classifier.joblib'))

        self._extract_emotions = load_pkl('extract_emotions.pkl')
        self._parse_date = load_pkl('parse_date.pkl')
        self._fill_date = load_pkl('fill_date.pkl')
        self._add_boolean_features = load_pkl('add_boolean_features.pkl')
        self._add_season = load_pkl('add_season.pkl')
        self._apply_status_encoder = load_pkl('apply_status_encoder.pkl')
        self._add_engineered_features = load_pkl('add_engineered_features.pkl')
        revenue_logic = load_pkl('revenue_logic.pkl')
        self._transform_log = revenue_logic['log_transform']
        self._apply_blockbuster_flag = revenue_logic['blockbuster_flag']
        self._add_runtime_features = load_pkl('add_runtime_features.pkl')
        self._apply_quality_mapping = load_pkl('apply_quality_mapping.pkl')
        self._extract_features = load_pkl('extract_features.pkl')
        self._apply_multilabel = load_pkl('apply_multilabel_features.pkl') if os.path.exists(os.path.join(ASSETS_DIR, 'apply_multilabel_features.pkl')) else None
        self.status_encoder = load_pkl('status_encoder.pkl')
        self.boolean_to_float = load_pkl('boolean_to_float.pkl')
        self._apply_encoder = load_pkl('apply_encoder.pkl')
        self.remove_useless_features = load_pkl('remove_useless_features.pkl')

        self.date_modes = self.pipeline_state['date_modes']
        self.blockbuster_threshold = self.pipeline_state['revenue_thresholds']['blockbuster']
        self.useless_cols = self.pipeline_state["useless_cols"]
        self.label_map = self.pipeline_state["label_map"]

    def _apply_text_imputers(self, df: pd.DataFrame) -> pd.DataFrame:
        for col in self.pipeline_state['cols_to_impute']['textual_cols']:
            if col in df.columns:
                df[[col]] = self.text_imputers[col].transform(df[[col]])
        return df
    
    def apply_numeric_imputers(self, df: pd.DataFrame) -> pd.DataFrame:
        for col in self.pipeline_state['cols_to_impute']['numeric_cols']:
            if col in df.columns:
                df[[col]] = self.numeric_imputers[col].transform(df[[col]])
        return df

    def _apply_emotion_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df['combined_text'] = (
            df['overview'].fillna('') + " " +
            df['tagline'].fillna('') + " " +
            df['genres'].fillna('')
        )
        calculated_features = df['combined_text'].apply(self._extract_emotions)
        for col in self.pipeline_state['cols_to_impute']['affective_cols']:
            df[col] = calculated_features[col]
        df.drop(columns=['combined_text'], inplace=True)
        return df
    
    def predict(self, data: pd.DataFrame) -> dict:
        df = data.copy()
        df = self.apply_numeric_imputers(df)

        df = self._apply_text_imputers(df)
        df = self._apply_emotion_features(df)

        df[['adult']] = self.adult_imputer.transform(df[['adult']])

        df = self.remove_useless_features(df)

        df = self._parse_date(df)
        df = self._fill_date(df, self.date_modes)

        df = self.boolean_to_float(df)

        df = self._add_boolean_features(df)
        df = self._add_season(df)

        df = self._apply_encoder(df, self.season_encoder, is_train=False)

        df = self._add_engineered_features(df)

        df['coverage_encoded'] = self.coverage_binner.transform(df[['movie_scl_coverage']])

        df = self._transform_log(df)

        df['revenue_tier_encoded'] = self.revenue_binner.transform(df[['revenue']])
        df = self._apply_blockbuster_flag(df, self.blockbuster_threshold)

        df = self._add_runtime_features(df)

        df = self._apply_status_encoder(df, self.status_encoder, is_train=False)

        df = self._apply_multilabel(df, self.multilabel_state)

        df = self._apply_quality_mapping(df)

        # continuous_cols = [c for c in self.scaling_state['continuous_columns'] if c in df.columns]
        df[self.scaling_state['continuous_columns']] = self.scaling_state['scaler'].transform(df[self.scaling_state['continuous_columns']])

        df = self._extract_features(df)

        predictions = self.model.predict(df)
        
        return {
            'movies': data['title'].tolist(),
            'popularityLevel': [self.label_map[str(p)] for p in predictions]
        }

    def evaluate(self, data: pd.DataFrame) -> dict:
        result = self.predict(data)

        if 'popularityLevel' not in data.columns:
            print("No target column found")
            return {
                'movies': result['movies'],
                'popularityLevel': result['popularityLevel'],
                'accuracy': None
            }

        y_true = data['popularityLevel'].tolist()
        y_pred = result['popularityLevel']

        accuracy = accuracy_score(y_true, y_pred)

        print(f"Accuracy : {accuracy:.4f}")

        return {
            'movies': result['movies'],
            'popularityLevel': result['popularityLevel'],
            'accuracy': accuracy
        }


@lru_cache
def get_classification_controller() -> ClassificationController:
    return ClassificationController()