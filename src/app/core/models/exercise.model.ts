export type ExerciseCategory = 'GYM' | 'CALISTHENICS';
export type VisualMediaType = 'CANVAS_2D' | 'VIDEO_3D' | 'IMAGE_SEQUENCE';
export type WorkoutStatus =
  | 'IDLE'
  | 'PREPARING'
  | 'EXERCISING'
  | 'RESTING'
  | 'PAUSED'
  | 'COMPLETED';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroup: string;
  description: string;
  instructions: string[];
  sets: number;
  reps: string;
  restSeconds: number;
  mediaType: VisualMediaType;
  equipment: string;
}

export interface ExecutionStep {
  title: string;
  description: string;
}
