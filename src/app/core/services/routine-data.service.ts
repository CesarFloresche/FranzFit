import { Injectable, signal } from '@angular/core';
import { Exercise } from '../models/exercise.model';
import { Routine } from '../models/routine.model';

const EXERCISES: Exercise[] = [
  {
    id: 'press-banca',
    name: 'Press de banca',
    category: 'GYM',
    muscleGroup: 'Pecho · Tríceps',
    description: 'Empuja la barra con control y mantén los omóplatos apoyados.',
    instructions: [
      'Apoya los pies firmes y retrae los omóplatos.',
      'Baja la barra hacia el centro del pecho.',
      'Empuja hacia arriba sin bloquear los codos.',
    ],
    sets: 4,
    reps: '8–10',
    restSeconds: 90,
    mediaType: 'CANVAS_2D',
    equipment: 'Barra y banco',
  },
  {
    id: 'sentadilla',
    name: 'Sentadilla',
    category: 'GYM',
    muscleGroup: 'Cuádriceps · Glúteos',
    description: 'Desciende con el torso estable y las rodillas alineadas.',
    instructions: [
      'Separa los pies al ancho de los hombros.',
      'Lleva la cadera atrás y baja con el pecho abierto.',
      'Empuja el suelo para volver a la posición inicial.',
    ],
    sets: 4,
    reps: '10–12',
    restSeconds: 90,
    mediaType: 'CANVAS_2D',
    equipment: 'Peso corporal o barra',
  },
  {
    id: 'peso-muerto',
    name: 'Peso muerto rumano',
    category: 'GYM',
    muscleGroup: 'Isquiotibiales · Glúteos',
    description: 'Trabaja la cadena posterior con una bisagra de cadera.',
    instructions: [
      'Sujeta la barra cerca de los muslos.',
      'Lleva la cadera atrás con la espalda neutral.',
      'Extiende la cadera para regresar sin impulsarte.',
    ],
    sets: 3,
    reps: '10–12',
    restSeconds: 90,
    mediaType: 'CANVAS_2D',
    equipment: 'Barra o mancuernas',
  },
  {
    id: 'dominadas',
    name: 'Dominadas',
    category: 'CALISTHENICS',
    muscleGroup: 'Espalda · Bíceps',
    description: 'Eleva el cuerpo hasta superar la barra sin balanceo.',
    instructions: [
      'Cuelga con agarre ligeramente más ancho que los hombros.',
      'Activa el abdomen y lleva los codos hacia abajo.',
      'Desciende despacio hasta extender los brazos.',
    ],
    sets: 4,
    reps: '6–8',
    restSeconds: 90,
    mediaType: 'CANVAS_2D',
    equipment: 'Barra de dominadas',
  },
  {
    id: 'flexiones',
    name: 'Flexiones',
    category: 'CALISTHENICS',
    muscleGroup: 'Pecho · Hombros · Tríceps',
    description: 'Mantén el cuerpo en línea mientras acercas el pecho al suelo.',
    instructions: [
      'Coloca las manos bajo los hombros.',
      'Baja el pecho con los codos a unos 45 grados.',
      'Empuja el suelo manteniendo el abdomen activo.',
    ],
    sets: 3,
    reps: '12–15',
    restSeconds: 60,
    mediaType: 'CANVAS_2D',
    equipment: 'Peso corporal',
  },
  {
    id: 'fondos',
    name: 'Fondos en paralelas',
    category: 'CALISTHENICS',
    muscleGroup: 'Tríceps · Pecho',
    description: 'Controla el descenso y evita hundir los hombros.',
    instructions: [
      'Sujétate de las barras con los brazos extendidos.',
      'Flexiona los codos y desciende hasta un rango cómodo.',
      'Empuja para subir sin encoger los hombros.',
    ],
    sets: 3,
    reps: '8–12',
    restSeconds: 75,
    mediaType: 'CANVAS_2D',
    equipment: 'Barras paralelas',
  },
];

const ROUTINES: Routine[] = [
  {
    id: 'fuerza-base',
    name: 'Fuerza base',
    category: 'GYM',
    description: 'Movimientos compuestos para una sesión completa de gimnasio.',
    exerciseIds: ['press-banca', 'sentadilla', 'peso-muerto'],
  },
  {
    id: 'parque-activo',
    name: 'Parque activo',
    category: 'CALISTHENICS',
    description: 'Una rutina de peso corporal para entrenar al aire libre.',
    exerciseIds: ['dominadas', 'flexiones', 'fondos'],
  },
];

@Injectable({ providedIn: 'root' })
export class RoutineDataService {
  private readonly exerciseData = signal<Exercise[]>(EXERCISES);
  private readonly routineData = signal<Routine[]>(ROUTINES);

  readonly exercises = this.exerciseData.asReadonly();
  readonly routines = this.routineData.asReadonly();

  getExercise(id: string): Exercise | undefined {
    return this.exerciseData().find((exercise) => exercise.id === id);
  }

  getRoutine(id: string): Routine | undefined {
    return this.routineData().find((routine) => routine.id === id);
  }
}
