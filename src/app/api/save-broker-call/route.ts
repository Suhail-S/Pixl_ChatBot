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
  return columns.map((c) => {
    const value = data[c];
    if (Array.isArray(value)) {
      return `"${value.map((v) => v.replace(/"/g, '""')).join("; ")}"`; // join arrays safely
    }
    return `"${(value ?? "").toString().replace(/"/g, '""')}"`;
  }).join(",") + "\n";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // All fields to be saved (add more as needed)
    const columns = [
      "timestamp",
      "sessionId",
      "broker_name",
      "broker_interest",
      "company",
      "fullname",
      "phone",
      "email",
      "reach",
      "budget",
      "selectedServices" // <-- ✅ added this line
    ];

    const rowData = {
      timestamp: new Date().toISOString(),
      ...body,
      selectedServices: body.selectedServices?.length > 0 ? body.selectedServices : "", // fallback to empty
    };

    ensureDirExists(DATA_DIR);

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
