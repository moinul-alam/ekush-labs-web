import { checkBonds, type MatchResult } from '../lib/prize-bond/matcher';
import type { WinItem } from '../lib/prize-bond/draw-store';

export interface WorkerInputMessage {
  action: 'match';
  numbers: string[];
  indexEntries: [string, WinItem[]][];
}

export interface WorkerProgressMessage {
  type: 'progress';
  processed: number;
  total: number;
}

export interface WorkerResultMessage {
  type: 'result';
  result: MatchResult;
}

self.onmessage = (event: MessageEvent<WorkerInputMessage>) => {
  const { action, numbers, indexEntries } = event.data;

  if (action === 'match') {
    const indexMap = new Map<string, WinItem[]>(indexEntries);
    const result = checkBonds(numbers, indexMap);
    self.postMessage({ type: 'result', result } as WorkerResultMessage);
  }
};
