import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const apiService = {

    predictClassification: async (movie: object) => {
        const { data } = await api.post("/predict", movie);
        return data;
    },

    predictClassificationBatch: async (movies: object[]) => {
        const { data } = await api.post("/predict/batch", movies);
        return data;
    },

    predictClassificationBatchCsv: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post("/predict/batch/csv", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },

    predictRegression: async (movie: object) => {
        const { data } = await api.post("/regression", movie);
        return data;
    },

    predictRegressionBatch: async (movies: object[]) => {
        const { data } = await api.post("/regression/batch", movies);
        return data;
    },

    predictRegressionBatchCsv: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post("/regression/batch/csv", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },

};