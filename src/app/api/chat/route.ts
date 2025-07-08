import { NextRequest, NextResponse } from "next/server";
import pixlTeam from "@/data/pixlTeam.json";

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
  // const wantsWork = /(work|case study|case studies|portfolio|project|client|campaign|examples? (of )?(work|projects|clients|done)|what has pixl done|past work|something pixl built|examples of results)/.test(lastMsg);

  // CEO/leadership injection
  if (wantsCEO) {
    const team = pixlTeam;
    const leadership = team.find((g: { group: string }) => g.group.toLowerCase().includes("leader") || g.group.toLowerCase().includes("ceo"));
    let ceoTxt = "";
    if (leadership && leadership.members && leadership.members.length > 0) {
      ceoTxt = "Pixl Leadership:\n";
      leadership.members.forEach(
        (m: { name: string; role: string }) =>
          (ceoTxt += `- ${m.name}, ${m.role}\n`)
      );
    } else {
      for (const g of team) {
        for (const m of g.members as { name: string; role: string }[]) {
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
    const teamGroups = (pixlTeam as { group: string; members: { name: string; role: string }[] }[])
      .map(
        (g) =>
          `- ${g.group}: ` +
          g.members
            .slice(0, 3)
            .map((m) => `${m.name} (${m.role})`)
            .join(", ") +
          (g.members.length > 3 ? ", ..." : "")
      ).join("\n");
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
    ...messages.map((m: { sender: "user" | "bot"; text: string }) =>
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