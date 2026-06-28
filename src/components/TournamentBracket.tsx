"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trophy, Loader2, ChevronRight, Circle } from "lucide-react";

type Match = { id: string; status: string; round: number; podCandidates: string[]; rankings: unknown };
type Ranking = { candidateId: string; rank: number; justification: string };

type Props = {
  matches: Match[];
  candidateNames: Map<string, string>;
  bracketStructure: number[][];
  currentRound: number;
  running: boolean;
};

const LABELS: Record<number, string> = { 1: "Group Stage", 2: "Top 16", 3: "Quarterfinals", 4: "Semifinals", 5: "Finals" };

function Pod({ match, names, isLast }: { match?: Match; names: Map<string, string>; isLast: boolean }) {
  const rankings = useMemo(() => (match?.rankings || []) as Ranking[], [match?.rankings]);
  const status = match?.status || "waiting";
  const done = status === "completed";
  const proc = status === "processing";

  const candidates = useMemo(() => {
    const ids = (match?.podCandidates || []) as string[];
    if (!done || !rankings.length) return ids;
    return [...ids].sort((a, b) => {
      const ra = rankings.find((r) => r.candidateId === a)?.rank ?? 99;
      const rb = rankings.find((r) => r.candidateId === b)?.rank ?? 99;
      return ra - rb;
    });
  }, [match?.podCandidates, rankings, done]);

  const winner = done ? rankings.find((r) => r.rank === 1) : null;
  const winnerName = winner ? (names.get(winner.candidateId) || winner.candidateId.slice(0, 12)) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-lg border p-2.5 min-w-[160px]
        ${done ? "bg-card border-border" : ""}
        ${proc ? "bg-card ring-1 ring-primary/40 border-primary/30" : ""}
        ${status === "waiting" ? "bg-muted/10 border-dashed border-muted-foreground/20" : ""}
        ${status === "pending" ? "bg-card border-amber-500/30" : ""}
        ${status === "failed" ? "bg-destructive/5 border-destructive/30" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <Circle className={`h-2 w-2 fill-current ${
          done ? "text-emerald-500" : proc ? "text-amber-400 animate-pulse" :
          status === "pending" ? "text-amber-500" : "text-muted-foreground/25"
        }`} />
        <span className="text-[10px] text-muted-foreground font-mono">
          {match ? match.id.slice(0, 5) : "—"}
        </span>
      </div>

      <div className="text-xs font-semibold mb-1.5 truncate">
        {done && winnerName ? (
          <span>{winnerName}</span>
        ) : proc ? (
          <span className="text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />Evaluating
          </span>
        ) : status === "waiting" ? (
          <span className="text-muted-foreground italic">TBD</span>
        ) : (
          <span className="text-muted-foreground">Ready</span>
        )}
        {winnerName && isLast && <Trophy className="h-3 w-3 text-yellow-500 inline ml-1" />}
        {winnerName && !isLast && <ChevronRight className="h-3 w-3 text-yellow-500 inline ml-0.5" />}
      </div>

      {candidates.length > 0 && (
        <div className="space-y-0.5">
          {candidates.map((cid) => {
            const name = names.get(cid) || cid.slice(0, 12);
            const rk = rankings.find((r) => r.candidateId === cid);
            return (
              <div key={cid} className="flex items-center gap-1 text-[11px]">
                {rk && <span className={`font-bold w-3 shrink-0 text-right ${rk.rank === 1 ? "text-yellow-500" : "text-muted-foreground"}`}>{rk.rank}</span>}
                {!rk && <span className="w-3 shrink-0" />}
                <span className={`truncate ${rk?.rank === 1 ? "font-semibold" : "text-muted-foreground"}`}>{name}</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export function TournamentBracket({ matches, candidateNames, bracketStructure, currentRound, running }: Props) {
  const matchMap = useMemo(() => {
    const m = new Map<number, Match[]>();
    for (const x of matches) {
      const arr = m.get(x.round) || [];
      arr.push(x);
      m.set(x.round, arr);
    }
    return m;
  }, [matches]);

  const rounds = useMemo(() => {
    if (bracketStructure.length > 0) {
      return bracketStructure.map((pods, ri) => ({
        round: ri + 1, podCount: pods.length,
      }));
    }
    const r = [...new Set(matches.map((x) => x.round))].sort((a, b) => a - b);
    return r.map((rn) => ({
      round: rn, podCount: matches.filter((x) => x.round === rn).length,
    }));
  }, [bracketStructure, matches]);

  if (rounds.length === 0) return null;

  const maxR = rounds.length;
  const completed = matches.filter((m) => m.status === "completed").length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Tournament Bracket
          <Badge variant="outline" className="text-xs ml-auto">
            {completed}/{matches.length} pods
            {running && ` · R${currentRound}/${maxR}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="p-4 flex gap-6" style={{ minWidth: maxR * 200 }}>
            {rounds.map(({ round, podCount }) => {
              const pods = (matchMap.get(round) || []).sort((a, b) => a.id.localeCompare(b.id));
              const slots = Math.max(podCount, pods.length);
              return (
                <div key={round} className="flex flex-col gap-2" style={{ flex: 1, minWidth: 170 }}>
                  <div className="text-center sticky top-0 bg-background/80 backdrop-blur py-1 rounded z-20">
                    <Badge
                      variant={running && round === currentRound ? "default" : "secondary"}
                      className="text-[11px] font-semibold"
                    >
                      {LABELS[round] || `Round ${round}`}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{podCount} pod{podCount !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="flex flex-col gap-2 justify-around flex-1">
                    {Array.from({ length: slots }).map((_, i) => (
                      <Pod
                        key={pods[i]?.id || `slot-r${round}-${i}`}
                        match={pods[i]}
                        names={candidateNames}
                        isLast={round === maxR}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
