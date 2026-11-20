import { ExerciseCategory } from './exercise.model';

export interface Routine {
  id: string;
  name: string;
  category: ExerciseCategory;
  description: string;
  exerciseIds: string[];
}
