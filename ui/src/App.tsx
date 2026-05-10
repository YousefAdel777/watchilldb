import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import { motion, AnimatePresence } from "motion/react";
import PredictPopularity from "./pages/Popularity";

const queryClient = new QueryClient();

export default function App() {
    return (
            <QueryClientProvider client={queryClient}>
                <Router>
                    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
                    <Navbar />
                    <AnimatePresence mode="wait">
                        <Routes>
                            <Route path="/predict" element={<PredictPopularity />} />
                            <Route path="/" element={<Home />} />
                            <Route path="/movie/:id" element={<MovieDetail />} />
                        </Routes>
                    </AnimatePresence>
                    </div>
                </Router>
            </QueryClientProvider>
    );
}
