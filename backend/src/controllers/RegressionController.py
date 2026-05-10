import pandas as pd
import json
import cloudpickle
import joblib
import numpy as np
from functools import lru_cache
import os
from sklearn.metrics import mean_squared_error, r2_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "..", "assets", "regression")


def load_pkl(filename):
    with open(os.path.join(ASSETS_DIR, filename), 'rb') as f:
        return cloudpickle.load(f)


class RegressionController:
    def __init__(self):
        state_path = os.path.join(ASSETS_DIR, "master_pipeline_state.json")
        with open(state_path, 'r') as f:
            self.pipeline_state = json.load(f)

        self.text_imputers = {}
        self.text_cols = self.pipeline_state['cols_to_impute']['textual_cols']
        for col in self.text_cols:
            pkl_path = os.path.join(ASSETS_DIR, f'{col}_imputer.pkl')
            with open(pkl_path, 'rb') as f:
                self.text_imputers[col] = cloudpickle.load(f)

        self.nlp_cols = self.pipeline_state['cols_to_impute']['nlp_cols']
        self.nlp_imputers = {}
        for col in self.nlp_cols:
            pkl_path = os.path.join(ASSETS_DIR, f'{col}_imputer.pkl')
            with open(pkl_path, 'rb') as f:
                self.nlp_imputers[col] = cloudpickle.load(f)

        self.adult_imputer = joblib.load(os.path.join(ASSETS_DIR, 'adult_imputer.pkl'))
        self.multilabel_state = joblib.load(os.path.join(ASSETS_DIR, 'multilabel_state.joblib'))
        self.season_encoder = joblib.load(os.path.join(ASSETS_DIR, 'season_encoder.joblib'))
        self.status_encoder = joblib.load(os.path.join(ASSETS_DIR, 'status_encoder.joblib'))
        self.scaler = joblib.load(os.path.join(ASSETS_DIR, 'scaler.joblib'))
        self.model = joblib.load(os.path.join(ASSETS_DIR, 'best_movie_regressor.joblib'))

        self._parse_date = load_pkl('parse_date.pkl')
        self._fill_date = load_pkl('fill_date.pkl')
        self._add_boolean_features = load_pkl('add_boolean_features.pkl')
        self._add_season = load_pkl('add_season.pkl')
        self._apply_status_encoder = load_pkl('apply_status_encoder.pkl')
        self._apply_multilabel = load_pkl('apply_multilabel_features.pkl')
        self._remove_highly_correlated = load_pkl('remove_highly_correlated.pkl')
        self._transform_log = load_pkl('transform_log.pkl')
        self._scale_features = load_pkl('scale_features.pkl')
        self._boolean_to_float = load_pkl('boolean_to_float.pkl')
        self._remove_useless_features = load_pkl('remove_useless_features.pkl')
        self._apply_encoder = load_pkl('apply_encoder.pkl')

        self.date_modes = self.pipeline_state['date_modes']

    def _apply_text_imputers(self, df: pd.DataFrame) -> pd.DataFrame:
        for col, imputer in self.text_imputers.items():
            if col in df.columns:
                df[[col]] = imputer.transform(df[[col]])
        return df

    def _apply_nlp_imputers(self, df: pd.DataFrame) -> pd.DataFrame:
        for col, imputer in self.nlp_imputers.items():
            if col in df.columns:
                df[[col]] = imputer.transform(df[[col]])
        return df

    def predict(self, data: pd.DataFrame) -> dict:
        df = data.copy()

        df = self._apply_text_imputers(df)
        df = self._apply_nlp_imputers(df)
        df[['adult']] = self.adult_imputer.transform(df[['adult']])
        df = self._remove_useless_features(df)
        df = self._parse_date(df)
        df = self._fill_date(df, self.date_modes)
        df = self._add_boolean_features(df)
        df = self._add_season(df)
        df = self._apply_encoder(df, self.season_encoder, is_train=False)
        df = self._boolean_to_float(df)
        df = self._apply_status_encoder(df, self.status_encoder, is_train=False)
        df = self._apply_multilabel(df, self.multilabel_state)
        df = self._remove_highly_correlated(df)
        df = self._transform_log(df)
        df = self._scale_features(df, self.scaler, is_train=False)

        expected_features = self.model.get_booster().feature_names
        df = df[expected_features]
        log_predictions = self.model.predict(df)
        predictions = np.expm1(log_predictions)

        return {
            'movies': data['title'].tolist(),
            'predictedPopularity': predictions.tolist()
        }

    def evaluate(self, data: pd.DataFrame) -> dict:
            result = self.predict(data)
            if 'popularity' not in data.columns:
                print("No target column found")
                return {
                    'movies': result['movies'],
                    'predictedPopularity': result['predictedPopularity'],
                    'mse': None,
                    'r2': None
                }
            
            y_true = data['popularity'].values
            y_pred = np.array(result['predictedPopularity'])
            mse = mean_squared_error(y_true, y_pred)
            r2 = r2_score(y_true, y_pred)
            print(f"MSE : {mse:.4f}")
            print(f"r2  : {r2:.4f}")
            return {
                'movies': result['movies'],
                'predictedPopularity': result['predictedPopularity'],
                'mse': mse,
                'r2': r2
            }

@lru_cache
def get_regression_controller() -> RegressionController:
    return RegressionController()