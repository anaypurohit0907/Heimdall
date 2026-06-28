"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Medal, Brain, Loader2 } from "lucide-react";

type Candidate = {
  id: string;
  name: string;
  email: string;
  eloScore: number;
  structuredData: unknown;
};

type Match = {
  id: string;
  status: string;
  round: number;
  podCandidates: string[];
  rankings: unknown;
};

type Ranking = { candidateId: string; rank: number; justification: string };

type TraceData = {
  id: string;
  round: number;
  reasoningTrace: string | null;
  rankings: Ranking[];
};

type Props = {
  candidates: Candidate[];
  matches: Match[];
};

function EloDelta({ candidateId, matches }: { candidateId: string; matches: Match[] }) {
  const recent = matches
    .filter((m) => m.status === "completed" && m.rankings)
    .find((m) => {
      const r = m.rankings as Ranking[];
      return r.some((x) => x.candidateId === candidateId);
    });
  if (!recent) return null;

  const rankings = recent.rankings as Ranking[];
  const rank = rankings.find((r) => r.candidateId === candidateId);
  if (!rank) return null;

  const colors: Record<number, string> = {
    1: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    2: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
    3: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    4: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`text-[10px] leading-none ${colors[rank.rank] || ""}`}>
      R{recent.round} #{rank.rank}
    </Badge>
  );
}

function MedalIcon({ index }: { index: number }) {
  if (index === 0) return <Medal className="h-4 w-4 text-yellow-500" />;
  if (index === 1) return <Medal className="h-4 w-4 text-zinc-400" />;
  if (index === 2) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="w-4 text-center text-xs text-muted-foreground">{index + 1}</span>;
}

export function Leaderboard({ candidates, matches }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [traces, setTraces] = useState<TraceData[]>([]);
  const [tracesLoading, setTracesLoading] = useState(false);

  const openDialog = useCallback(
    (candidateId: string) => {
      setSelectedId(candidateId);
      setTraces([]);

      const candidateMatches = matches.filter(
        (m) =>
          m.status === "completed" &&
          (m.podCandidates as string[]).includes(candidateId),
      );

      if (candidateMatches.length === 0) return;

      setTracesLoading(true);
      Promise.all(
        candidateMatches.map((m) =>
          fetch(`/api/tournament/trace?matchId=${m.id}`).then((r) => r.json()),
        ),
      )
        .then((results) => {
          setTraces(
            results
              .filter((t: TraceData) => t.reasoningTrace)
              .sort((a: TraceData, b: TraceData) => b.round - a.round),
          );
          setTracesLoading(false);
        })
        .catch(() => setTracesLoading(false));
    },
    [matches],
  );

  const closeDialog = useCallback(() => {
    setSelectedId(null);
    setTraces([]);
  }, []);

  const sorted = [...candidates].sort((a, b) => b.eloScore - a.eloScore);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Candidate</TableHead>
            <TableHead className="w-20 text-right">Elo</TableHead>
            <TableHead className="w-20 text-right">Pod</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {sorted.map((c, i) => (
              <motion.tr
                key={c.id}
                layout
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="cursor-pointer hover:bg-muted/50 group"
                onClick={() => openDialog(c.id)}
              >
                <TableCell><MedalIcon index={i} /></TableCell>
                <TableCell>
                  <div className="font-medium text-sm truncate max-w-[200px]">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">{c.email}</div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {c.eloScore}
                </TableCell>
                <TableCell className="text-right">
                  <EloDelta candidateId={c.id} matches={matches} />
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>

      <Dialog open={!!selectedId} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 shrink-0" />
              <span className="truncate">
                {candidates.find((c) => c.id === selectedId)?.name ?? "Candidate"}
              </span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground">Gemini evaluation log</p>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 pb-6">
            {tracesLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading reasoning traces...
              </div>
            ) : traces.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No evaluations yet. Run a tournament to see AI reasoning.
              </p>
            ) : (
              <div className="space-y-6 pt-2">
                {traces.map((trace) => {
                  const myRank = trace.rankings.find((r) => r.candidateId === selectedId);

                  return (
                    <div key={trace.id} className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[11px]">
                          Round {trace.round}
                        </Badge>
                        {myRank && (
                          <Badge variant="secondary" className="text-[11px] max-w-full">
                            <span className="truncate">
                              Rank #{myRank.rank} — {myRank.justification}
                            </span>
                          </Badge>
                        )}
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-4 overflow-hidden">
                        <p className="text-[11px] font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                          Reasoning Trace
                        </p>
                        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed max-h-[50vh] overflow-y-auto">
                          {trace.reasoningTrace}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
