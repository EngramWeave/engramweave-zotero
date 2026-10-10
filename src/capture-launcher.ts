import type { Selection } from './selection.js';
import { errorMessage } from './errors.js';

/** Reader menu callbacks run with a content-window caller. Open chrome UI only in a fresh host task. */
export class CaptureLauncher {
  private stopped = false;
  private readonly pending = new Set<ReturnType<typeof setTimeout>>();
  constructor(private readonly open: (selection: Selection) => void, private readonly report: (message: string) => void) {}
  capture(snapshot: () => Selection) {
    if (this.stopped) return;
    let launch: () => void;
    // Freeze selected material before yielding; never retain the Reader event for later UI work.
    try { const selection = snapshot(); launch = () => this.open(selection); }
    catch (error) { const message = errorMessage(error, 'Cannot capture selected material'); launch = () => this.report(message); }
    const timer = setTimeout(() => {
      this.pending.delete(timer);
      if (this.stopped) return;
      try { launch(); } catch (error) { this.report(errorMessage(error, 'Cannot open Capture')); }
    }, 0);
    this.pending.add(timer);
  }
  stop() { this.stopped = true; for (const timer of this.pending) clearTimeout(timer); this.pending.clear(); }
}
