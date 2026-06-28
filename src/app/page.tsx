"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { TournamentBracket } from "@/components/TournamentBracket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, Swords, Trophy } from "lucide-react";

type Candidate = { id: string; name: string; email: string; eloScore: number; structuredData: unknown };
type Match = { id: string; status: string; round: number; podCandidates: string[]; rankings: unknown };
type JD = { id: string; title: string; rawText: string };

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [matches, setMatches] = useState<Map<string, Match>>(new Map());
  const [jd, setJd] = useState<JD | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(0);
  const [bracket, setBracket] = useState<number[][]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [totalPods, setTotalPods] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  // ── Initial load ──
  const init = useCallback(async () => {
    const [cRes, tRes, jRes] = await Promise.all([
      fetch("/api/candidates"),
      fetch("/api/tournament"),
      fetch("/api/jd"),
    ]);
    if (cRes.ok) setCandidates(await cRes.json());
    if (tRes.ok) {
      const d = await tRes.json();
      const map = new Map<string, Match>();
      for (const m of (d.matches || [])) map.set(m.id, m);
      setMatches(map);
      setCandidates(d.leaderboard || []);
    }
    if (jRes.ok) setJd(await jRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, [init]);

  // ── Start tournament ──
  const start = async () => {
    if (!jd) return;
    setRunning(true);
    setDoneCount(0);
    setCurrentRound(1);

    const res = await fetch("/api/tournament/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jdId: jd.id }),
    });
    const data = await res.json();
    if (!res.ok) { setRunning(false); return; }

    setBracket(data.bracket || []);
    setTotalPods(data.totalPods || 0);
    setTotalRounds(data.totalRounds || 0);

    // Fetch initial match state
    const tRes = await fetch("/api/tournament");
    if (tRes.ok) {
      const d = await tRes.json();
      const map = new Map<string, Match>();
      for (const m of (d.matches || [])) map.set(m.id, m);
      setMatches(map);
      setCandidates(d.leaderboard || []);
    }

    // SSE stream
    const es = new EventSource("/api/tournament/events");
    esRef.current = es;

    es.addEventListener("round_start", (e) => {
      const p = JSON.parse(e.data);
      setCurrentRound(p.data.round);
    });

    es.addEventListener("match_done", async (e) => {
      const p = JSON.parse(e.data);
      setDoneCount((prev) => prev + 1);
      if (p.data?.error) return;

      // Update single match + Elo scores in-place
      setMatches((prev) => {
        const next = new Map(prev);
        const m = next.get(p.matchId);
        if (m) {
          next.set(p.matchId, {
            ...m,
            status: "completed",
            rankings: p.data.rankings,
          });
        }
        return next;
      });

      // Update candidate Elo scores
      if (p.data.eloUpdates) {
        setCandidates((prev) =>
          prev.map((c) => {
            const u = p.data.eloUpdates.find(
              (x: { candidateId: string }) => x.candidateId === c.id,
            );
            return u ? { ...c, eloScore: u.newElo } : c;
          }),
        );
      }
    });

    es.addEventListener("round_end", () => {
      // Refresh full state after each round (for new matches with winners)
      fetch("/api/tournament").then(async (r) => {
        if (r.ok) {
          const d = await r.json();
          const map = new Map<string, Match>();
          for (const m of (d.matches || [])) map.set(m.id, m);
          setMatches(map);
          setCandidates(d.leaderboard || []);
        }
      });
    });

    es.addEventListener("tournament_end", () => {
      setRunning(false);
      es.close();
      fetch("/api/tournament").then(async (r) => {
        if (r.ok) {
          const d = await r.json();
          const map = new Map<string, Match>();
          for (const m of (d.matches || [])) map.set(m.id, m);
          setMatches(map);
          setCandidates(d.leaderboard || []);
        }
      });
    });

    es.onerror = () => { setRunning(false); es.close(); };
  };

  useEffect(() => () => esRef.current?.close(), []);

  // ── Derived state ──
  const matchArray = useMemo(() => [...matches.values()], [matches]);
  const candidateNames = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of candidates) m.set(c.id, c.name);
    return m;
  }, [candidates]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Swords className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Heimdall Arena</h1>
            <p className="text-sm text-muted-foreground">AI Tournament · Elo Ranking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {jd && <Badge variant="secondary" className="text-xs max-w-[200px] truncate">{jd.title}</Badge>}
          {running && <Badge variant="outline" className="text-xs">R{currentRound}/{totalRounds}</Badge>}
          <Button onClick={start} disabled={!jd || running} className="gap-2">
            {running ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{doneCount}/{totalPods}</>
            ) : (
              <><Play className="h-4 w-4" />Start Tournament</>
            )}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" /> Leaderboard · sorted by Elo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Leaderboard candidates={candidates} matches={matchArray} />
        </CardContent>
      </Card>

      <TournamentBracket
        matches={matchArray}
        candidateNames={candidateNames}
        bracketStructure={bracket}
        currentRound={currentRound}
        running={running}
      />
    </div>
  );
}
