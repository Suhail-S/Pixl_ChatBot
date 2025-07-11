import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define the expected structure of broker form data
interface BrokerFormData {
  timestamp: string;
  sessionId?: string;
  broker_name?: string;
  broker_interest?: string;
  company?: string;
  fullname?: string;
  phone?: string;
  email?: string;
  reach?: string;
  budget?: string;
  selectedServices?: string[];
}

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
function toCsvRow(data: BrokerFormData, columns: string[]): string {
  return columns.map((c) => {
    const value = data[c as keyof BrokerFormData];
    if (Array.isArray(value)) {
      return `"${value.map((v) => String(v).replace(/"/g, '""')).join("; ")}"`; // Escape inner quotes
    }
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }).join(",") + "\n";
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    const rowData: BrokerFormData = {
      timestamp: new Date().toISOString(),
      ...rawBody,
      selectedServices: Array.isArray(rawBody.selectedServices) ? rawBody.selectedServices : [],
    };

    const columns: (keyof BrokerFormData)[] = [
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
      "selectedServices",
    ];

    ensureDirExists(DATA_DIR);

    const writeHeader = !fs.existsSync(CSV_PATH);
    const toWrite =
      (writeHeader ? columns.join(",") + "\n" : "") +
      toCsvRow(rowData, columns as string[]);

    fs.appendFileSync(CSV_PATH, toWrite);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const error = e instanceof Error ? e : new Error("Unknown error");
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
