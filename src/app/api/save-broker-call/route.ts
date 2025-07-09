import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Target CSV directory and file
const DATA_DIR = path.join(process.cwd(), "user", "data");
const CSV_PATH = path.join(DATA_DIR, "broker_leads.csv");

// Ensure directory exists
function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Convert answers (object) to CSV row, using consistent columns order
function toCsvRow(data: Record<string, any>, columns: string[]): string {
  return columns.map((c) => `"${(data[c] ?? "").toString().replace(/"/g, '""')}"`).join(",") + "\n";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Combine all possible fields (examples, expand if needed)
    const columns = [
      "timestamp",
      "sessionId",
      "broker_name",
      "broker_interest",
      "company",
      "fullname",
      "phone",
      "email",
      "reach"
    ];
    const rowData = {
      timestamp: new Date().toISOString(),
      ...body
    };

    ensureDirExists(DATA_DIR);

    // Write header if file does not exist
    const writeHeader = !fs.existsSync(CSV_PATH);
    const toWrite =
      (writeHeader ? columns.join(",") + "\n" : "") +
      toCsvRow(rowData, columns);

    fs.appendFileSync(CSV_PATH, toWrite);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}