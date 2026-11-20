import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { vi } from 'vitest';

describe('App', () => {
  beforeEach(async () => {
    vi.stubGlobal('IntersectionObserver', class {
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
      takeRecords(): IntersectionObserverEntry[] { return []; }
    });
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Un paso más');
    expect(compiled.querySelector('.visual-stage')).toBeTruthy();
  });

  it('should switch between gym and calisthenics exercises', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const calisthenicsButton = Array.from(compiled.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Calistenia'));
    calisthenicsButton?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.exercise-title-group h3')?.textContent).toContain('Dominadas');
  });
});
