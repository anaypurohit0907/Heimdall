import { NextRequest } from "next/server";
import { tournamentEvents } from "@/lib/events";

const EVENTS = ["round_start", "match_done", "round_end", "tournament_end"] as const;

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("connected", {});

      const handlers: Record<string, (p: unknown) => void> = {};
      for (const ev of EVENTS) {
        const h = (payload: unknown) => send(ev, payload);
        handlers[ev] = h;
        tournamentEvents.on(ev, h);
      }

      const keepAlive = setInterval(() => send("ping", {}), 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        for (const ev of EVENTS) tournamentEvents.off(ev, handlers[ev]);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
