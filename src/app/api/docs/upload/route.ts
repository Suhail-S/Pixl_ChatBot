import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const LOG_PATH = path.resolve(process.cwd(), "docsLog.json");

// Helper: parse multipart (only Node 18+ and Next.js edge, use Request.formData)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("doc") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Accept only PDF/DOCX
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    // Could extract real text/chunk/embed here, but stub for now
    await file.arrayBuffer(); // no-op for now (as chunking not yet used)
    // Optionally save uploads somewhere: omitted for now

    // Update docsLog.json
    let log: { name: string; uploadedAt: string }[] = [];
    try {
      log = JSON.parse(await fs.readFile(LOG_PATH, "utf8"));
    } catch { /* ignore */ }
    log.unshift({ name: file.name, uploadedAt: new Date().toISOString() });
    await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2));

    // Emulate chunking for now
    const indexedChunks = 1;

    return NextResponse.json({ success: true, indexedChunks });
  } catch (error) {
    let errorMsg = "Upload failed.";
    if (typeof error === "object" && error && "message" in error) {
      errorMsg = String((error as { message?: string }).message);
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}