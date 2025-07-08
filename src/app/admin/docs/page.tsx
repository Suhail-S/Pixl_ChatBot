"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocLogEntry = { name: string; uploadedAt: string };

export default function AdminDocsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(null);
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<DocLogEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load docs log from API on mount & after upload
  React.useEffect(() => {
    fetch("/api/docs")
      .then(r => r.ok ? r.json() : [])
      .then(data => setLogs(data))
      .catch(() => setLogs([]));
  }, []);

  async function handleUpload() {
    if (!file) {
      setStatus({ type: "error", message: "Please choose a PDF or DOCX file." });
      return;
    }
    setUploading(true);
    setStatus(null);
    const form = new FormData();
    form.append("doc", file);
    try {
      const res = await fetch("/api/docs/upload", {
        method: "POST",
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setStatus({ type: "success", message: `Indexed ${data.indexedChunks} chunk${data.indexedChunks > 1 ? "s" : ""}.` });
      // Reload log
      fetch("/api/docs")
        .then(r => r.ok ? r.json() : [])
        .then(data => setLogs(data))
        .catch(() => {});
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      const msg =
        typeof err === "object" && err && "message" in err
          ? String((err as { message?: string }).message)
          : "Upload failed";
      setStatus({ type: "error", message: msg });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-8 py-6 bg-neutral-900 border-b border-neutral-800">
        <Image src="/window.svg" alt="Pixl" width={40} height={40} />
        <h1 className="text-2xl font-bold text-white">Pixl Admin: Upload Documents</h1>
      </header>
      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full py-12 px-4 flex flex-col gap-10">
        {/* Upload Bar */}
        <section className="flex flex-col gap-2">
          <div className="flex gap-3 items-center bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={e => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              className="flex-1 bg-neutral-800 text-neutral-100 rounded-lg p-2 file:bg-purple-700 file:text-white file:rounded-lg file:px-3 file:py-2"
              disabled={uploading}
            />
            <Button
              type="button"
              className={cn("flex gap-2 items-center min-w-[150px] rounded-lg bg-purple-600 hover:bg-purple-700 transition", uploading && "opacity-60")}
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading && <span className="spinner border-t-white border-2 border-neutral-100 rounded-full w-4 h-4 animate-spin mr-2" />}
              {uploading ? "Uploading…" : "Upload Document"}
            </Button>
          </div>
          {status && (
            <div
              className={cn(
                "mt-2 rounded-lg px-4 py-2 text-base text-center w-full max-w-lg mx-auto",
                status.type === "success"
                  ? "bg-green-900 text-green-300"
                  : "bg-red-900 text-red-200"
              )}
            >
              {status.message}
            </div>
          )}
        </section>
        {/* Documents Log */}
        <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 font-mono shadow flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-white mb-3">Uploaded Documents Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left">
              <thead>
                <tr>
                  <th className="text-purple-300 font-semibold pb-2">Filename</th>
                  <th className="text-purple-300 font-semibold pb-2">Uploaded At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{log.name}</td>
                    <td>{new Date(log.uploadedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <style>
        {`.spinner { display:inline-block; border-radius:50%; border:2px solid #c4b5fd; border-top:2px solid #fff; width:1.2em; height:1.2em; animation:spin .8s linear infinite; vertical-align:middle;}
          @keyframes spin { to { transform: rotate(360deg); } }
        `}
      </style>
    </div>
  );
}