import {afterEach,it,expect,vi} from 'vitest';
import {CaptureLauncher} from '../src/capture-launcher.js';
import type {Selection} from '../src/selection.js';
afterEach(()=>vi.useRealTimers());
it('reads the selection synchronously but opens chrome UI only after the content callback has returned',()=>{
  vi.useFakeTimers();const order:string[]=[],snapshot={paper:{title:'selected'}} as Selection;
  const open=vi.fn(()=>order.push('open'));const report=vi.fn();const launcher=new CaptureLauncher(open,report);
  launcher.capture(()=>{order.push('read');return snapshot;});order.push('content callback returned');
  expect(order).toEqual(['read','content callback returned']);expect(open).not.toHaveBeenCalled();vi.runAllTimers();
  expect(order).toEqual(['read','content callback returned','open']);expect(open).toHaveBeenCalledWith(snapshot);expect(report).not.toHaveBeenCalled();
});
it('defers unsupported-selection error windows too, and unload cancels all pending launches',()=>{
  vi.useFakeTimers();const open=vi.fn(),report=vi.fn(),launcher=new CaptureLauncher(open,report);
  launcher.capture(()=>{throw {message:'Selected ink contains no text or comment'};});expect(report).not.toHaveBeenCalled();vi.runAllTimers();expect(report).toHaveBeenCalledWith('Selected ink contains no text or comment');
  launcher.capture(()=>({}) as Selection);launcher.capture(()=>{throw new Error('Do not show after unload');});launcher.stop();vi.runAllTimers();expect(open).not.toHaveBeenCalled();expect(report).toHaveBeenCalledTimes(1);
});
