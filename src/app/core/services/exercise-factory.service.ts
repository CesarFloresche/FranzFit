import { Injectable, inject } from '@angular/core';
import { Exercise, ExerciseCategory, VisualMediaType } from '../models/exercise.model';
import { RoutineDataService } from './routine-data.service';

export interface ExerciseRenderer {
  mediaType: VisualMediaType;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class ExerciseFactoryService {
  private readonly routineData = inject(RoutineDataService);

  createExercise(id: string, category: ExerciseCategory): Exercise | undefined {
    const exercise = this.routineData.getExercise(id);
    return exercise?.category === category ? { ...exercise } : undefined;
  }

  createRenderer(exercise: Exercise): ExerciseRenderer {
    const labels: Record<VisualMediaType, string> = {
      CANVAS_2D: 'Biomecánica interactiva',
      VIDEO_3D: 'Demostración en video',
      IMAGE_SEQUENCE: 'Secuencia de movimiento',
    };
    return { mediaType: exercise.mediaType, label: labels[exercise.mediaType] };
  }
}
