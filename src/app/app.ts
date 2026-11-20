import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Exercise, ExerciseCategory } from './core/models/exercise.model';
import { ExerciseFactoryService } from './core/services/exercise-factory.service';
import { RoutineDataService } from './core/services/routine-data.service';
import { WorkoutSessionStateService } from './core/states/workout-session.state';
import { CanvasViewerComponent } from './shared/components/canvas-viewer/canvas-viewer.component';
import { YoutubeDrawerComponent } from './shared/components/youtube-drawer/youtube-drawer.component';
import { AiCoachComponent } from './shared/components/ai-coach/ai-coach.component';

@Component({
  selector: 'app-root',
  imports: [CanvasViewerComponent, YoutubeDrawerComponent, AiCoachComponent, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  private readonly routineData = inject(RoutineDataService);
  private readonly exerciseFactory = inject(ExerciseFactoryService);

  readonly workout = inject(WorkoutSessionStateService);
  readonly category = signal<ExerciseCategory>('GYM');
  readonly selectedExerciseId = signal('press-banca');
  readonly selectedRoutineId = signal('fuerza-base');
  readonly exercises = this.routineData.exercises;
  readonly routines = this.routineData.routines;
  readonly visibleExercises = computed(() =>
    this.exercises().filter((exercise) => exercise.category === this.category()),
  );
  readonly activeExercise = computed(() =>
    this.exerciseFactory.createExercise(this.selectedExerciseId(), this.category()),
  );
  readonly activeRenderer = computed(() => {
    const exercise = this.activeExercise();
    return exercise ? this.exerciseFactory.createRenderer(exercise) : undefined;
  });
  readonly activeRoutine = computed(() =>
    this.routines().find((routine) => routine.id === this.selectedRoutineId()),
  );
  readonly currentExerciseNumber = computed(() =>
    this.visibleExercises().findIndex((exercise) => exercise.id === this.selectedExerciseId()) + 1,
  );
  readonly progress = computed(() => {
    const total = this.visibleExercises().length;
    return total ? Math.round((this.currentExerciseNumber() / total) * 100) : 0;
  });

  selectCategory(category: ExerciseCategory): void {
    if (this.category() === category) return;
    this.workout.reset();
    this.category.set(category);
    const firstExercise = this.exercises().find((exercise) => exercise.category === category);
    if (firstExercise) this.selectedExerciseId.set(firstExercise.id);
    const firstRoutine = this.routines().find((routine) => routine.category === category);
    if (firstRoutine) this.selectedRoutineId.set(firstRoutine.id);
  }

  selectExercise(exercise: Exercise): void {
    if (exercise.id === this.selectedExerciseId()) return;
    this.workout.reset();
    this.selectedExerciseId.set(exercise.id);
  }

  selectRoutine(routineId: string): void {
    const routine = this.routineData.getRoutine(routineId);
    if (!routine) return;
    this.workout.reset();
    this.category.set(routine.category);
    this.selectedRoutineId.set(routine.id);
    const firstExerciseId = routine.exerciseIds[0];
    if (firstExerciseId) this.selectedExerciseId.set(firstExerciseId);
  }

  onRoutineChange(event: Event): void {
    const select = event.target;
    if (select instanceof HTMLSelectElement) this.selectRoutine(select.value);
  }

  nextExercise(): void {
    const exercises = this.visibleExercises();
    const nextIndex = this.currentExerciseNumber();
    const nextExercise = exercises[nextIndex];
    if (nextExercise) {
      this.selectedExerciseId.set(nextExercise.id);
      return;
    }
    this.workout.finish();
  }

  restartWorkout(): void {
    if (this.workout.status() === 'COMPLETED') {
      this.workout.reset();
      const firstExerciseId = this.activeRoutine()?.exerciseIds[0];
      if (firstExerciseId) this.selectedExerciseId.set(firstExerciseId);
    }
    this.workout.start();
  }

  startRest(): void {
    const exercise = this.activeExercise();
    if (exercise) this.workout.startRest(exercise.restSeconds);
  }

  readonly categoryLabel = (category: ExerciseCategory): string =>
    category === 'GYM' ? 'Gimnasio' : 'Calistenia';
}
