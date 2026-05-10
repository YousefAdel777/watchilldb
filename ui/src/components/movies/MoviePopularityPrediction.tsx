import { useQuery } from "@tanstack/react-query";
import { apiService } from "../../services/predict";
import { BarChart3, TrendingUp, Loader2, Activity } from "lucide-react";

export default function MoviePopularityPrediction({ movie }: any) {
    const { data, isLoading } = useQuery({
        queryKey: ["movie-prediction", movie?.id],
        queryFn: async () => {
            const payload = {
                ...movie,
                genres: movie.genres?.map((g: any) => g.name).join(" "),
                production_countries: movie.production_countries.map(c => c.name).join(" "),
                spoken_languages: movie.spoken_languages.map(l => l.english_name).join(" "),
                production_companies: movie.production_companies.map(c => c.name).join(" "),
            };

            const [classification, regression] = await Promise.all([
                apiService.predictClassification(payload),
                apiService.predictRegression(payload),
            ]);

            return {
                classification,
                regression,
            };
        },
        enabled: !!movie,
    });

    if (isLoading) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex items-center justify-center">
                <Loader2 className="animate-spin text-white/30" />
            </div>
        );
    }

    const actualPopularity = movie?.popularity ?? 0;
    const classification = data?.classification?.popularityLevel?.[0];
    const regression = data?.regression?.predictedPopularity?.[0];

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 sm:p-8 flex flex-col gap-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 flex items-center gap-2">
                <BarChart3 size={12} />
                Popularity Prediction
            </h3>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-white/40 flex items-center gap-2">
                        <Activity size={12} />
                        Actual Popularity
                    </span>
                    <span className="text-sm font-black text-white">
                        {actualPopularity.toFixed(1)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-white/40">
                        Classification
                    </span>
                    <span className="text-sm font-black text-white">
                        {classification ?? "N/A"}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-white/40 flex items-center gap-2">
                        <TrendingUp size={12} />
                        Regression Prediction
                    </span>
                    <span className="text-sm font-black text-white">
                        {regression ? regression.toFixed(2) : "N/A"}
                    </span>
                </div>
            </div>
        </div>
    );
}