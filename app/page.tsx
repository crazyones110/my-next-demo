"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
    const [code, setCode] = useState("");
    const [uuid, setUuid] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [srcDoc, setSrcDoc] = useState("");

    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
    }, []);

    const handleBenchmark = useCallback(async () => {
        const newUuid = uuidv4();
        setUuid(newUuid);
        setIsRunning(true);
        setIsReady(false);

        try {
            const response = await fetch(`/api/benchmark?uuid=${newUuid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                console.error("Failed to start benchmark");
                setIsRunning(false);
                setUuid(null);
            }
        } catch (error) {
            console.error("Error starting benchmark:", error);
            setIsRunning(false);
            setUuid(null);
        }
    }, [code]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (isRunning && uuid) {
            intervalId = setInterval(async () => {
                try {
                    const response = await fetch(`/api/benchmark?uuid=${uuid}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.result) {
                            setIsReady(true);
                            setIsRunning(false);
                            setSrcDoc(data.result);
                            if (intervalId) {
                                clearInterval(intervalId);
                            }
                        }
                    } else {
                        console.error("Failed to fetch benchmark result");
                        setIsRunning(false);
                    }
                } catch (error) {
                    console.error("Error fetching benchmark result:", error);
                    setIsRunning(false);
                }
            }, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isRunning, uuid]);

    return (
        <main className="container mx-auto px-4 py-8">
            <textarea
                className="w-full h-64 p-2 border border-gray-300 rounded mb-4"
                value={code}
                onChange={handleCodeChange}
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
                    <iframe srcDoc={srcDoc} className="w-full h-screen"/>
                </div>
            )}
        </main>
    );
}