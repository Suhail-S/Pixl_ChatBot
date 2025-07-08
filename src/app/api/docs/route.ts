import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Persist log in a JSON file on disk
const LOG_PATH = path.resolve(process.cwd(), "docsLog.json");

export async function GET() {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    const log: { name: string; uploadedAt: string }[] = JSON.parse(raw);
    return NextResponse.json(log, { status: 200 });
  } catch {
    // If not found, return blank array
    return NextResponse.json([], { status: 200 });
  }
}