import { TestBed } from '@angular/core/testing';
import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  let service: ViewportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewportService);
  });

  afterEach(() => {
    service.destroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose width and height as signals', () => {
    expect(typeof service.width()).toBe('number');
    expect(typeof service.height()).toBe('number');
    expect(service.width()).toBeGreaterThan(0);
    expect(service.height()).toBeGreaterThan(0);
  });

  it('should compute aspectRatio', () => {
    service.width.set(1920);
    service.height.set(1080);
    expect(service.aspectRatio()).toBeCloseTo(1.777, 2);
  });

  it('should detect mobile when width < 768', () => {
    service.width.set(500);
    service.height.set(800);
    expect(service.isMobile()).toBe(true);
    expect(service.isTablet()).toBe(false);
    expect(service.isDesktop()).toBe(false);
  });

  it('should detect tablet when width is between 768 and 1023', () => {
    service.width.set(800);
    service.height.set(600);
    expect(service.isMobile()).toBe(false);
    expect(service.isTablet()).toBe(true);
    expect(service.isDesktop()).toBe(false);
  });

  it('should detect desktop when width >= 1024', () => {
    service.width.set(1440);
    service.height.set(900);
    expect(service.isMobile()).toBe(false);
    expect(service.isTablet()).toBe(false);
    expect(service.isDesktop()).toBe(true);
  });

  it('should match breakpoints correctly', () => {
    service.width.set(900);
    const match = service.match();
    expect(match.xs).toBe(true);
    expect(match.sm).toBe(true);
    expect(match.md).toBe(true);
    expect(match.lg).toBe(false);
    expect(match.xl).toBe(false);
  });
});
