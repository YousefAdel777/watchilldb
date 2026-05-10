from fastapi import APIRouter, Depends, UploadFile, File
from model.requests import PredictRequest
from controllers import ClassificationController, get_classification_controller, RegressionController, get_regression_controller
import pandas as pd
import io

prediction_router = APIRouter(
    prefix="/api/v1",
    tags=["api_v1", "predict"]
)

@prediction_router.post("/predict")
async def predict(predict_request: PredictRequest, classification_controller: ClassificationController = Depends(get_classification_controller)):
    df = pd.DataFrame([predict_request.model_dump()])
    prediction = classification_controller.predict(data=df)
    return prediction

@prediction_router.post("/predict/batch")
async def predict_batch(predict_requests: list[PredictRequest], classification_controller: ClassificationController = Depends(get_classification_controller)):
    df = pd.DataFrame([r.model_dump() for r in predict_requests])
    prediction = classification_controller.predict(data=df)
    return prediction

@prediction_router.post("/predict/batch/csv")
async def predict_batch_csv(
    file: UploadFile = File(...),
    classification_controller: ClassificationController = Depends(get_classification_controller)
):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    prediction = classification_controller.predict(data=df)
    return prediction

@prediction_router.post("/regression")
async def predict(predict_request: PredictRequest, regression_controller: RegressionController = Depends(get_regression_controller)):
    df = pd.DataFrame([predict_request.model_dump()])
    prediction = regression_controller.predict(data=df)
    return prediction

@prediction_router.post("/regression/batch")
async def predict_batch(predict_requests: list[PredictRequest], regression_controller: RegressionController = Depends(get_regression_controller)):
    df = pd.DataFrame([r.model_dump() for r in predict_requests])
    prediction = regression_controller.predict(data=df)
    return prediction

@prediction_router.post("/regression/batch/csv")
async def predict_batch_csv(
    file: UploadFile = File(...),
    regression_controller: RegressionController = Depends(get_regression_controller)
):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    prediction = regression_controller.predict(data=df)
    return prediction