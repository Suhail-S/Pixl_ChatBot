import { NextRequest, NextResponse } from "next/server";
import pixlTeam from "@/data/pixlTeam.json";

interface TeamMember {
  name: string;
  role: string;
  image?: string;
}

interface TeamGroup {
  group: string;
  members: TeamMember[];
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OpenAI API key from environment." }, { status: 500 });
  }
  const url = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  let enrichedPrompt = systemPrompt;
  const lastMsg = messages.length > 0 ? messages[messages.length - 1].text.toLowerCase() : "";
  const wantsCEO = /(ceo|founder|leadership|who ?(is|leads) pixl|head)/.test(lastMsg);
  const wantsTeams = /(different|all|pixl)? ?teams?|(departments?|groups?|divisions?)/.test(lastMsg);

  // CEO/leadership injection
  if (wantsCEO) {
    const team: TeamGroup[] = pixlTeam as TeamGroup[];
    const leadership = team.find(
      (g: TeamGroup) =>
        g.group.toLowerCase().includes("leader") ||
        g.group.toLowerCase().includes("ceo")
    );
    let ceoTxt = "";
    if (leadership && leadership.members.length > 0) {
      ceoTxt = "Pixl Leadership:\n";
      leadership.members.forEach((m: TeamMember) => {
        ceoTxt += `- ${m.name}, ${m.role}\n`;
      });
    } else {
      for (const g of team) {
        for (const m of g.members) {
          if (/ceo|founder|chief executive/i.test(m.role)) {
            ceoTxt += `Pixl Leadership: ${m.name}, ${m.role}\n`;
          }
        }
      }
    }
    if (ceoTxt) {
      enrichedPrompt = ceoTxt + "\n" + enrichedPrompt;
    }
  }

  // Team injection
  if (wantsTeams) {
    const team: TeamGroup[] = pixlTeam as TeamGroup[];
    const teamGroups = team
      .map(
        (g: TeamGroup) =>
          `- ${g.group}: ` +
          g.members
            .slice(0, 3)
            .map((m: TeamMember) => `${m.name} (${m.role})`)
            .join(", ") +
          (g.members.length > 3 ? ", ..." : "")
      )
      .join("\n");
    enrichedPrompt =
      "Pixl Teams & Departments:\n" +
      teamGroups +
      "\n" +
      enrichedPrompt;
  }

  // WORK/portfolio/case studies injection
  // if (wantsWork) {
  //   const workCases = pixlWork
  //     .slice(0, 8)
  //     .map(
  //       (w: any) =>
  //         `- "${w.title}" (${w.summary ? w.summary.slice(0, 70).replace(/\n+/g, " ") + "…" : ""})`
  //     )
  //     .join("\n");
  //   enrichedPrompt =
  //     "Here are real Pixl client projects and case studies:\n" +
  //     workCases +
  //     "\n" +
  //     enrichedPrompt;
  // }

  const openaiMessages = [
    { role: "system", content: enrichedPrompt },
    ...messages.map((m: { sender: string, text: string }) =>
      m.sender === "user"
        ? { role: "user", content: m.text }
        : { role: "assistant", content: m.text }
    ),
  ];

  const body = JSON.stringify({
    model: "gpt-4o",
    messages: openaiMessages,
    temperature: 0.55,
    stream: true,
  });

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!resp.body) {
    return NextResponse.json({ error: "No stream from OpenAI." }, { status: 500 });
  }

  return new Response(resp.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}