import {it,expect} from 'vitest';
import {errorMessage} from '../src/errors.js';
it('preserves cross-realm native error messages without reducing them to a generic failure',()=>{
  const native={message:'Core configuration file cannot be read: D:\\Config\\config.json'};
  expect(native instanceof Error).toBe(false);expect(errorMessage(native,'Connection failed')).toBe(native.message);
  expect(errorMessage({message:''},'Connection failed')).toBe('Connection failed');expect(errorMessage(null,'Connection failed')).toBe('Connection failed');
});
