import { describe, expect, it } from 'vitest';
import { DISABLED_MINUTES, TIME_MINUTES, pickerDisabledTime } from './timePicker';

describe('timePicker daqiqalari', () => {
  it('00, 15, 30, 45 va 59 ni qoldiradi', () => {
    expect([...TIME_MINUTES]).toEqual([0, 15, 30, 45, 59]);
    expect(DISABLED_MINUTES).not.toContain(59);
    expect(DISABLED_MINUTES).toContain(1);
    expect(DISABLED_MINUTES).toHaveLength(55);
    expect(pickerDisabledTime().disabledMinutes()).toEqual(DISABLED_MINUTES);
  });
});
