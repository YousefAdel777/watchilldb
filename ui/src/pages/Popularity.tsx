import React, { useState, useRef } from "react";
import { Loader2, Upload, FileText, X, BarChart2, Film, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiService } from "../services/predict";

const QUALITY_OPTIONS = ["real_confident", "real_likely", "spam_confident", "spam_likely", "stub_legitimate", "stub_uncertain"];
const STATUS_OPTIONS = ["Canceled", "In Production", "Planned", "Post Production", "Released", "Rumored"];
const ADULT_OPTIONS = [false, true];
const ORIGINAL_LANGUAGE_OPTIONS = ["aa","ab","af","ak","am","an","ar","as","av","ay","az","ba","be","bg","bi","bm","bn","bo","br","bs","ca","ce","ch","cn","co","cr","cs","cv","cy","da","de","dv","dz","ee","el","en","eo","es","et","eu","fa","ff","fi","fj","fo","fr","fy","ga","gd","gl","gn","gu","gv","ha","he","hi","hr","ht","hu","hy","hz","ia","id","ie","ig","ii","ik","is","it","iu","ja","jv","ka","kg","ki","kj","kk","kl","km","kn","ko","ks","ku","kv","kw","ky","la","lb","lg","li","ln","lo","lt","lv","mg","mh","mi","mk","ml","mn","mo","mr","ms","mt","my","nb","nd","ne","nl","nn","no","nv","ny","oc","oj","om","or","os","pa","pl","ps","pt","qu","rm","rn","ro","ru","rw","sa","sc","sd","se","sg","sh","si","sk","sl","sm","sn","so","sq","sr","ss","st","su","sv","sw","ta","te","tg","th","ti","tk","tl","tn","to","tr","ts","tt","tw","ty","ug","uk","ur","uz","ve","vi","wo","xh","xx","yi","yo","za","zh","zu"];

const LEVEL_CONFIG: Record<string, { color: string; bg: string; bar: string }> = {
    "High":      { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", bar: "bg-emerald-400" },
    "Medium":    { color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20",     bar: "bg-amber-400" },
    "Low":       { color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20",   bar: "bg-orange-400" },
    "Very Low":  { color: "text-red-400",     bg: "bg-red-400/10 border-red-400/20",         bar: "bg-red-400" },
};

const LEVEL_WIDTH: Record<string, string> = {
    "High": "w-full", "Medium": "w-2/3", "Low": "w-1/3", "Very Low": "w-1/6",
};

type FormData = {
    movie_valence: string; movie_vad_valence: string; movie_vad_arousal: string;
    movie_vad_dominance: string; movie_intensity_anger: string; movie_intensity_anticipation: string;
    movie_intensity_disgust: string; movie_intensity_fear: string; movie_intensity_joy: string;
    movie_intensity_sadness: string; movie_intensity_surprise: string; movie_intensity_trust: string;
    movie_scl_shift: string; movie_scl_coverage: string; vote_average: string; vote_count: string;
    revenue: string; runtime: string; budget: string;
    quality: string; status: string; original_language: string; adult: string; theatrical: boolean;
    title: string; original_title: string; overview: string; tagline: string; genres: string;
    production_companies: string; production_countries: string; spoken_languages: string;
    poster_path: string; backdrop_path: string; homepage: string; release_date: string;
};

const EMPTY: FormData = {
    movie_valence: "", movie_vad_valence: "", movie_vad_arousal: "", movie_vad_dominance: "",
    movie_intensity_anger: "", movie_intensity_anticipation: "", movie_intensity_disgust: "",
    movie_intensity_fear: "", movie_intensity_joy: "", movie_intensity_sadness: "",
    movie_intensity_surprise: "", movie_intensity_trust: "", movie_scl_shift: "", movie_scl_coverage: "",
    vote_average: "", vote_count: "", revenue: "", runtime: "", budget: "",
    quality: "real_confident", status: "Canceled", original_language: "aa", adult: "false",
    theatrical: true, title: "", original_title: "", overview: "", tagline: "", genres: "",
    production_companies: "", production_countries: "", spoken_languages: "",
    poster_path: "", backdrop_path: "", homepage: "", release_date: "",
};

type Mode = "form" | "csv";
type PredictorTab = "classification" | "regression";

type BatchMovieResult = {
    movie: string;
    result: string;
};

type SingleClassificationResult = {
    popularityLevel: string;
};

type SingleRegressionResult = {
    predictedPopularity: number;
};

type BatchRegressionResult = {
    movie: string;
    score: number;
};

export default function PredictPopularity() {
    const [predictorTab, setPredictorTab] = useState<PredictorTab>("classification");
    const [mode, setMode] = useState<Mode>("form");
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>(EMPTY);
    const [singleResult, setSingleResult] = useState<SingleClassificationResult | null>(null);
    const [singleRegressionResult, setSingleRegressionResult] = useState<SingleRegressionResult | null>(null);
    const [batchResults, setBatchResults] = useState<BatchMovieResult[]>([]);
    const [batchRegressionResults, setBatchRegressionResults] = useState<BatchRegressionResult[]>([]);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const set = (key: keyof FormData, value: string | boolean) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const clearResults = () => {
        setError(null);
        setSingleResult(null);
        setSingleRegressionResult(null);
        setBatchResults([]);
        setBatchRegressionResults([]);
    };

    const buildPayload = () => {
        const payload: any = { ...formData };
        const numericKeys = [
            "movie_valence","movie_vad_valence","movie_vad_arousal","movie_vad_dominance",
            "movie_intensity_anger","movie_intensity_anticipation","movie_intensity_disgust",
            "movie_intensity_fear","movie_intensity_joy","movie_intensity_sadness",
            "movie_intensity_surprise","movie_intensity_trust","movie_scl_shift","movie_scl_coverage",
            "vote_average","popularity",
        ];
        const intKeys = ["vote_count","revenue","runtime","budget"];
        numericKeys.forEach(k => { payload[k] = payload[k] !== "" ? parseFloat(payload[k]) : null; });
        intKeys.forEach(k => { payload[k] = payload[k] !== "" ? parseInt(payload[k]) : null; });
        payload.adult = payload.adult === "true";
        payload.id = 0;
        return payload;
    };

    const handleCsvDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file?.name.endsWith(".csv")) setCsvFile(file);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        clearResults();
        try {
            const payload = buildPayload();
            if (predictorTab === "classification") {
                const result = await apiService.predictClassificationBatch([payload]);
                setSingleResult({ popularityLevel: result.popularityLevel[0] });
            } else {
                const result = await apiService.predictRegressionBatch([payload]);
                setSingleRegressionResult({ predictedPopularity: result.predictedPopularity[0] });
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail ? JSON.stringify(err.response.data.detail) : String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleCsvSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvFile) return;
        setLoading(true);
        clearResults();
        try {
            if (predictorTab === "classification") {
                const result = await apiService.predictClassificationBatchCsv(csvFile);
                setBatchResults(result.popularityLevel.map((level: string, index: number) => ({
                    movie: result.movies[index],
                    result: level,
                })));
            } else {
                const result = await apiService.predictRegressionBatchCsv(csvFile);
                setBatchRegressionResults(result.predictedPopularity.map((score: number, index: number) => ({
                    movie: result.movies[index],
                    score,
                })));
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail ? JSON.stringify(err.response.data.detail) : String(err));
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 transition-all w-full";
    const labelClass = "text-[10px] font-black uppercase text-white/40 tracking-widest";

    const numField = (label: string, key: keyof FormData) => (
        <div className="flex flex-col gap-2">
            <label className={labelClass}>{label}</label>
            <input type="number" className={inputClass}
                value={formData[key] as string} onChange={(e) => set(key, e.target.value)} />
        </div>
    );

    const textField = (label: string, key: keyof FormData) => (
        <div className="flex flex-col gap-2">
            <label className={labelClass}>{label}</label>
            <input type="text" className={inputClass}
                value={formData[key] as string} onChange={(e) => set(key, e.target.value)} />
        </div>
    );

    const selectField = (label: string, key: keyof FormData, options: (string | boolean)[]) => (
        <div className="flex flex-col gap-2">
            <label className={labelClass}>{label}</label>
            <select className={`${inputClass} appearance-none`} value={formData[key] as string}
                onChange={(e) => set(key, e.target.value)}>
                {options.map((opt) => (
                    <option key={String(opt)} value={String(opt)} className="bg-black">{String(opt)}</option>
                ))}
            </select>
        </div>
    );

    const toggleField = (label: string, key: keyof FormData) => (
        <div className="flex items-center justify-between sm:justify-start gap-3 pt-2">
            <label className={labelClass}>{label}</label>
            <button type="button" onClick={() => set(key, !(formData[key] as boolean))}
                className={`w-10 h-5 rounded-full transition-all relative ${formData[key] ? "bg-white" : "bg-white/10"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${formData[key] ? "left-5" : "left-0.5"}`} />
            </button>
            <span className="text-xs text-white/40">{formData[key] ? "Yes" : "No"}</span>
        </div>
    );

    const section = (text: string) => (
        <div className="col-span-1 sm:col-span-2 flex items-center gap-4 pt-2">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 whitespace-nowrap">{text}</span>
            <div className="flex-1 h-px bg-white/5" />
        </div>
    );

    const FormFields = () => (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Identity")}
                {textField("Title", "title")}
                {textField("Original Title", "original_title")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Classification")}
                {selectField("Quality", "quality", QUALITY_OPTIONS)}
                {selectField("Status", "status", STATUS_OPTIONS)}
                {selectField("Adult", "adult", ADULT_OPTIONS)}
                {toggleField("Theatrical", "theatrical")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Release")}
                <div className="flex flex-col gap-2">
                    <label className={labelClass}>Release Date</label>
                    <input type="date" className={inputClass} value={formData.release_date}
                        onChange={(e) => set("release_date", e.target.value)} />
                </div>
                {selectField("Original Language", "original_language", ORIGINAL_LANGUAGE_OPTIONS)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Financials")}
                {numField("Budget ($)", "budget")}
                {numField("Revenue ($)", "revenue")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Metrics")}
                {numField("Runtime (min)", "runtime")}
                {numField("Vote Average", "vote_average")}
                {numField("Vote Count", "vote_count")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Content")}
                <div className="sm:col-span-2 flex flex-col gap-2">
                    <label className={labelClass}>Overview</label>
                    <textarea rows={4}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 transition-all resize-none"
                        value={formData.overview} onChange={(e) => set("overview", e.target.value)} />
                </div>
                {textField("Tagline", "tagline")}
                {textField("Genres", "genres")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Production")}
                <div className="sm:col-span-2">{textField("Production Companies", "production_companies")}</div>
                {textField("Production Countries", "production_countries")}
                {textField("Spoken Languages", "spoken_languages")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Media")}
                {textField("Poster Path", "poster_path")}
                {textField("Backdrop Path", "backdrop_path")}
                {textField("Homepage", "homepage")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Sentiment")}
                {numField("Valence", "movie_valence")}
                {numField("VAD Valence", "movie_vad_valence")}
                {numField("VAD Arousal", "movie_vad_arousal")}
                {numField("VAD Dominance", "movie_vad_dominance")}
                {numField("SCL Shift", "movie_scl_shift")}
                {numField("SCL Coverage", "movie_scl_coverage")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section("Emotion Intensities")}
                {numField("Anger", "movie_intensity_anger")}
                {numField("Anticipation", "movie_intensity_anticipation")}
                {numField("Disgust", "movie_intensity_disgust")}
                {numField("Fear", "movie_intensity_fear")}
                {numField("Joy", "movie_intensity_joy")}
                {numField("Sadness", "movie_intensity_sadness")}
                {numField("Surprise", "movie_intensity_surprise")}
                {numField("Trust", "movie_intensity_trust")}
            </div>
        </>
    );

    const ResultCard = ({ level, index }: { level: string; index?: number }) => {
        const cfg = LEVEL_CONFIG[level] ?? { color: "text-white", bg: "bg-white/10 border-white/20", bar: "bg-white" };
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index !== undefined ? index * 0.05 : 0 }}
                className={`border rounded-2xl p-4 flex flex-col gap-3 ${cfg.bg}`}
            >
                {index !== undefined && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Row {index + 1}</span>
                )}
                <span className={`text-2xl font-black uppercase tracking-tight ${cfg.color}`}>{level}</span>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: (index ?? 0) * 0.05 + 0.2, duration: 0.5 }}
                        className={`h-full rounded-full ${cfg.bar} ${LEVEL_WIDTH[level]}`}
                        style={{ width: undefined }}
                    />
                </div>
            </motion.div>
        );
    };

    const RegressionScoreCard = ({ score, movie, index }: { score: number; movie?: string; index?: number }) => (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index !== undefined ? index * 0.05 : 0 }}
            className="border border-blue-400/20 bg-blue-400/10 rounded-2xl p-4 flex flex-col gap-3"
        >
            {movie && <span className="text-sm font-black uppercase text-white truncate">{movie}</span>}
            {index !== undefined && !movie && (
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Row {index + 1}</span>
            )}
            <span className="text-2xl font-black text-blue-400">{score.toFixed(3)}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/30">Predicted Popularity Score</span>
        </motion.div>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-20 sm:pb-24 min-h-screen">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10 sm:gap-12">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-none">
                    Predict Popularity
                </h1>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 w-fit">
                        {([["classification", Film, "Classification"], ["regression", TrendingUp, "Regression"]] as const).map(([tab, Icon, label]) => (
                            <button key={tab} type="button"
                                onClick={() => { setPredictorTab(tab); clearResults(); }}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                                    ${predictorTab === tab ? "bg-white text-black" : "text-white/40 hover:text-white/70"}`}>
                                <Icon size={12} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 w-fit">
                        {(["form", "csv"] as Mode[]).map((m) => (
                            <button key={m} type="button" onClick={() => { setMode(m); clearResults(); }}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                                    ${mode === m ? "bg-white text-black" : "text-white/40 hover:text-white/70"}`}>
                                {m === "form" ? <Film size={12} /> : <Upload size={12} />}
                                {m === "form" ? "Single" : "CSV Batch"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    <AnimatePresence mode="wait">
                        {mode === "form" ? (
                            <motion.form noValidate key="form" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                onSubmit={handleFormSubmit}
                                className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-3xl flex flex-col gap-8">
                                <FormFields />
                                <button disabled={loading}
                                    className="w-full cursor-pointer bg-white text-black font-black py-4 rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : predictorTab === "classification" ? "Predict Popularity Level" : "Predict Popularity Score"}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form key="csv" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                onSubmit={handleCsvSubmit}
                                className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-3xl flex flex-col gap-6">

                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Upload CSV</span>
                                    <p className="text-xs text-white/30 leading-relaxed">
                                        CSV must include all required columns matching the model's input schema.
                                        Each row will be predicted independently.
                                    </p>
                                </div>

                                <div
                                    onDrop={handleCsvDrop}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all
                                        ${dragOver ? "border-white/40 bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"}`}>
                                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCsvFile(f); }} />
                                    <Upload size={28} className={dragOver ? "text-white" : "text-white/30"} />
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-white/60">Drop your CSV here</p>
                                        <p className="text-xs text-white/30 mt-1">or click to browse</p>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {csvFile && (
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                            <FileText size={16} className="text-white/40 shrink-0" />
                                            <span className="text-sm text-white/70 flex-1 truncate">{csvFile.name}</span>
                                            <span className="text-xs text-white/30 shrink-0">{(csvFile.size / 1024).toFixed(1)} KB</span>
                                            <button type="button" onClick={() => setCsvFile(null)}
                                                className="text-white/30 hover:text-white/70 transition-colors shrink-0">
                                                <X size={14} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button disabled={loading || !csvFile}
                                    className="w-full cursor-pointer bg-white text-black font-black py-4 rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <><Upload size={14} /> Predict from CSV</>}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-4 lg:sticky lg:top-28">
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 font-mono break-all">
                                    {error}
                                </motion.div>
                            )}

                            {singleResult && (
                                <motion.div key="single" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
                                    <div className="flex items-center gap-2">
                                        <BarChart2 size={14} className="text-white/30" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Result</span>
                                    </div>
                                    <ResultCard level={singleResult.popularityLevel} />
                                </motion.div>
                            )}

                            {singleRegressionResult && (
                                <motion.div key="single-regression" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={14} className="text-white/30" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Result</span>
                                    </div>
                                    <RegressionScoreCard score={singleRegressionResult.predictedPopularity} />
                                </motion.div>
                            )}

                            {batchResults.length > 0 && (
                                <motion.div key="batch" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BarChart2 size={14} className="text-white/30" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Batch Results</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{batchResults.length} rows</span>
                                    </div>
                                    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                                        {batchResults.map((item, i) => {
                                            const cfg = LEVEL_CONFIG[item.result] ?? { color: "text-white", bg: "bg-white/10 border-white/20", bar: "bg-white" };
                                            return (
                                                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className={`border rounded-2xl p-4 flex items-center justify-between gap-4 ${cfg.bg}`}>
                                                    <span className="text-sm font-black uppercase text-white truncate">{item.movie}</span>
                                                    <span className={`text-sm font-black uppercase whitespace-nowrap ${cfg.color}`}>{item.result}</span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {batchRegressionResults.length > 0 && (
                                <motion.div key="batch-regression" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={14} className="text-white/30" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Batch Results</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{batchRegressionResults.length} rows</span>
                                    </div>
                                    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                                        {batchRegressionResults.map((item, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="border border-blue-400/20 bg-blue-400/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                                                <span className="text-sm font-black uppercase text-white truncate">{item.movie}</span>
                                                <span className="text-sm font-black text-blue-400 whitespace-nowrap">{item.score.toFixed(3)}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!singleResult && !singleRegressionResult && batchResults.length === 0 && batchRegressionResults.length === 0 && !error && (
                            <div className="border border-dashed border-white/5 rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
                                <BarChart2 size={24} className="text-white/10" />
                                <p className="text-xs text-white/20 uppercase tracking-widest font-black">Results will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}