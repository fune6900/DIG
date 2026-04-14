import type { DiagnosticFlow } from "@/types/diagnostic";
import { levisFlow } from "./levis";

const FLOWS: Record<string, DiagnosticFlow> = {
  levis: levisFlow,
};

export function getFlowById(id: string): DiagnosticFlow | undefined {
  return FLOWS[id];
}
