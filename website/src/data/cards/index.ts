import caching from "./caching.json";
import distributedSystems from "./distributed-systems.json";
import fundamentals from "./fundamentals.json";
import microservices from "./microservices.json";
import networking from "./networking.json";
import observability from "./observability.json";
import patterns from "./patterns.json";
import queue from "./queue.json";
import reliability from "./reliability.json";
import replication from "./replication.json";
import scaling from "./scaling.json";
import security from "./security.json";

export interface FlashCard {
  id: string;
  category: string;
  front: string;
  back: string;
  difficulty: string;
  tags: string[];
}

export const allCards: FlashCard[] = [
  ...caching,
  ...distributedSystems,
  ...fundamentals,
  ...microservices,
  ...networking,
  ...observability,
  ...patterns,
  ...queue,
  ...reliability,
  ...replication,
  ...scaling,
  ...security,
];