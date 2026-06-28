import { EventEmitter } from "events";

declare global {
  var __tournamentEvents: EventEmitter | undefined;
}

export const tournamentEvents =
  globalThis.__tournamentEvents ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis.__tournamentEvents = tournamentEvents;
}

tournamentEvents.setMaxListeners(50);
