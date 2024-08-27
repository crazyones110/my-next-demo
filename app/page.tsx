"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
    const [code, setCode] = useState("");
    const [uuid, setUuid] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const handleBenchmark = async () => {
        const newUuid = uuidv4();
        setUuid(newUuid);
        setIsRunning(false);
        setIsReady(false);

        try {
            const response = await fetch(`/api/benchmark?uuid=${newUuid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            if (response.ok) {
                setIsRunning(true);
            } else {
                console.error("Failed to start benchmark");
                setUuid(null);
            }
        } catch (error) {
            console.error("Error starting benchmark:", error);
            setUuid(null);
        }
    };

    useEffect(() => {
        if (isRunning && uuid) {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/benchmark?uuid=${uuid}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.ready) {
                            setIsReady(true);
                            setIsRunning(false);
                            clearInterval(interval);
                        }
                    } else {
                        console.error("Failed to fetch benchmark result");
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error("Error fetching benchmark result:", error);
                    clearInterval(interval);
                }
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isRunning, uuid]);

    return (
        <main className="container mx-auto px-4 py-8">
            <textarea
                className="w-full h-64 p-2 border border-gray-300 rounded mb-4"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your TypeScript code here..."
            />
            <button
                className={`
          font-bold py-2 px-4 rounded
          ${
              isRunning
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-50"
                  : "bg-blue-500 hover:bg-blue-700 text-white"
          }
          transition-all duration-300 ease-in-out
        `}
                onClick={handleBenchmark}
                disabled={isRunning}
            >
                {isRunning ? "Benchmarking..." : "Benchmark"}
            </button>
            {isRunning && <p className="mt-4">Benchmarking in progress...</p>}
            {isReady && (
                <div className="mt-4">
                    <h2 className="text-xl font-bold mb-2">
                        Benchmark Result:
                    </h2>
                    <iframe srcDoc="" />
                </div>
            )}
        </main>
    );
}
