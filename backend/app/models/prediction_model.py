from __future__ import annotations

from dataclasses import dataclass
from sklearn.linear_model import LinearRegression
import numpy as np


@dataclass
class TrafficModel:
    reg: LinearRegression

    @staticmethod
    def train_mock() -> "TrafficModel":
        # Mock training data: columns -> [weather_score, event_score, historical_score]
        X = np.array([
            [0.8, 0.6, 0.7],
            [0.2, 0.1, 0.3],
            [0.5, 0.2, 0.4],
            [0.9, 0.9, 0.9],
            [0.4, 0.7, 0.6],
            [0.7, 0.4, 0.8],
        ])
        # target score in [0,1]
        y = np.array([0.75, 0.2, 0.4, 0.95, 0.6, 0.7])
        reg = LinearRegression().fit(X, y)
        return TrafficModel(reg=reg)

    def predict(self, weather: float, events: float, historical: float) -> float:
        features = np.array([[weather, events, historical]])
        pred = float(self.reg.predict(features)[0])
        return max(0.0, min(1.0, pred))


# Singleton mock model
model_instance: TrafficModel | None = None


def get_model() -> TrafficModel:
    global model_instance
    if model_instance is None:
        model_instance = TrafficModel.train_mock()
    return model_instance


