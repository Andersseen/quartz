import { TestBed } from '@angular/core/testing';
import { QzIdGenerator } from './id-generator';

describe('QzIdGenerator', () => {
  it('numbers each prefix independently starting at 1', () => {
    const ids = TestBed.inject(QzIdGenerator);
    expect([ids.next('qz-a'), ids.next('qz-a'), ids.next('qz-b'), ids.next('qz-a')]).toEqual([
      'qz-a-1',
      'qz-a-2',
      'qz-b-1',
      'qz-a-3',
    ]);
  });

  it('gives every application its own counters (no cross-request leak)', () => {
    const first = TestBed.inject(QzIdGenerator);
    first.next('qz-a');
    first.next('qz-a');
    TestBed.resetTestingModule();
    expect(TestBed.inject(QzIdGenerator).next('qz-a')).toBe('qz-a-1');
  });
});
