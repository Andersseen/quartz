import { describe, it, expect } from 'vitest';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  it('should create with sidebar closed', () => {
    const service = new LayoutService();
    expect(service.sidebarOpen()).toBe(false);
  });

  it('should toggle sidebar open and closed', () => {
    const service = new LayoutService();
    service.toggle();
    expect(service.sidebarOpen()).toBe(true);
    service.toggle();
    expect(service.sidebarOpen()).toBe(false);
  });

  it('should close sidebar', () => {
    const service = new LayoutService();
    service.toggle();
    expect(service.sidebarOpen()).toBe(true);
    service.close();
    expect(service.sidebarOpen()).toBe(false);
  });

  it('should keep sidebar closed when close is called on closed sidebar', () => {
    const service = new LayoutService();
    service.close();
    expect(service.sidebarOpen()).toBe(false);
  });
});
