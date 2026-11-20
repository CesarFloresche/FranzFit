import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { WorkoutStatus } from '../models/exercise.model';

@Injectable({ providedIn: 'root' })
export class WorkoutSessionStateService implements OnDestroy {
  private readonly workoutStatus = signal<WorkoutStatus>('IDLE');
  private readonly secondsElapsed = signal(0);
  private readonly restSecondsRemaining = signal(0);
  private timerId: ReturnType<typeof setInterval> | undefined;
  private restTimerId: ReturnType<typeof setInterval> | undefined;

  readonly status = this.workoutStatus.asReadonly();
  readonly elapsedSeconds = this.secondsElapsed.asReadonly();
  readonly restRemaining = this.restSecondsRemaining.asReadonly();
  readonly elapsedLabel = computed(() => {
    const minutes = Math.floor(this.secondsElapsed() / 60);
    const seconds = this.secondsElapsed() % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  start(): void {
    if (this.workoutStatus() === 'EXERCISING' || this.workoutStatus() === 'RESTING') return;
    if (this.workoutStatus() === 'COMPLETED') this.secondsElapsed.set(0);
    this.workoutStatus.set('EXERCISING');
    this.startTimer();
  }

  pause(): void {
    if (this.workoutStatus() !== 'EXERCISING') return;
    this.workoutStatus.set('PAUSED');
    this.stopTimer();
  }

  startRest(seconds: number): void {
    if (this.workoutStatus() !== 'EXERCISING' || seconds <= 0) return;
    this.stopTimer();
    this.restSecondsRemaining.set(seconds);
    this.workoutStatus.set('RESTING');
    this.stopRestTimer();
    this.restTimerId = setInterval(() => {
      const remaining = this.restSecondsRemaining() - 1;
      this.restSecondsRemaining.set(remaining);
      if (remaining <= 0) this.endRest();
    }, 1000);
  }

  skipRest(): void {
    if (this.workoutStatus() === 'RESTING') this.endRest();
  }

  finish(): void {
    this.stopTimer();
    this.stopRestTimer();
    this.restSecondsRemaining.set(0);
    this.workoutStatus.set('COMPLETED');
  }

  reset(): void {
    this.stopTimer();
    this.stopRestTimer();
    this.secondsElapsed.set(0);
    this.restSecondsRemaining.set(0);
    this.workoutStatus.set('IDLE');
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => this.secondsElapsed.update((value) => value + 1), 1000);
  }

  private endRest(): void {
    this.stopRestTimer();
    this.restSecondsRemaining.set(0);
    this.workoutStatus.set('EXERCISING');
    this.startTimer();
  }

  private stopRestTimer(): void {
    if (this.restTimerId !== undefined) {
      clearInterval(this.restTimerId);
      this.restTimerId = undefined;
    }
  }

  private stopTimer(): void {
    if (this.timerId !== undefined) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }
}
