import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Exercise } from '../../../core/models/exercise.model';

@Component({
  selector: 'app-canvas-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas role="img" [attr.aria-label]="'Ilustración biomecánica de ' + exercise.name">
      Ilustración del movimiento: {{ exercise.name }}
    </canvas>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; min-height: 220px; }
    canvas { display: block; width: 100%; height: 100%; min-height: 220px; }
  `],
})
export class CanvasViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) exercise!: Exercise;
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  private ready = false;
  private animationFrameId: number | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private startedAt = 0;

  ngAfterViewInit(): void {
    this.ready = true;
    this.startedAt = performance.now();
    this.resizeObserver = new ResizeObserver(() => this.draw(performance.now(), false));
    this.resizeObserver.observe(this.canvasRef.nativeElement);
    this.draw(this.startedAt);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['exercise'] && this.ready) {
      if (this.animationFrameId !== undefined) cancelAnimationFrame(this.animationFrameId);
      this.startedAt = performance.now();
      this.draw(this.startedAt);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.animationFrameId !== undefined) cancelAnimationFrame(this.animationFrameId);
  }

  private draw(time: number, scheduleNext = true): void {
    const canvas = this.canvasRef.nativeElement;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(bounds.width, 300);
    const height = Math.max(bounds.height, 220);
    const scale = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(width * scale);
    const pixelHeight = Math.round(height * scale);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      if (scheduleNext) this.animationFrameId = requestAnimationFrame((nextTime) => this.draw(nextTime));
      return;
    }
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    const cycleSeconds = 3.4;
    const cycle = ((time - this.startedAt) / 1000 / cycleSeconds) % 1;
    const rep = 0.5 - 0.5 * Math.cos(cycle * Math.PI * 2);
    const floorY = height * 0.82;
    context.strokeStyle = 'rgba(177, 191, 180, 0.15)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(width * 0.12, floorY);
    context.lineTo(width * 0.88, floorY);
    context.stroke();

    const centerX = width * 0.52;
    const accent = '#c5f36b';
    const muted = '#8ea091';
    const limbWidth = Math.max(7, Math.min(width, height) * 0.025);
    const radius = limbWidth * 0.78;

    context.fillStyle = 'rgba(197, 243, 107, 0.12)';
    context.beginPath();
    context.arc(centerX, height * 0.54, Math.min(width, height) * 0.28 + Math.sin(cycle * Math.PI * 2) * 3, 0, Math.PI * 2);
    context.fill();

    if (this.exercise.id === 'sentadilla') {
      this.drawSquat(context, width, height, floorY, rep, limbWidth, radius, accent);
    } else if (this.exercise.id === 'dominadas') {
      this.drawPullUp(context, width, height, rep, limbWidth, radius, accent);
    } else if (this.exercise.id === 'fondos') {
      this.drawDip(context, width, height, rep, limbWidth, radius, accent);
    } else if (this.exercise.id === 'flexiones') {
      this.drawPushUp(context, width, height, floorY, rep, limbWidth, radius, accent);
    } else if (this.exercise.id === 'peso-muerto') {
      this.drawDeadlift(context, width, height, floorY, rep, limbWidth, radius, accent);
    } else {
      this.drawBenchPress(context, width, height, floorY, rep, limbWidth, radius, accent);
    }

    context.fillStyle = accent;
    context.font = '600 11px Inter, sans-serif';
    context.fillText('POSTURA Y CONTROL', width * 0.08, height * 0.14);
    context.fillStyle = muted;
    context.font = '12px Inter, sans-serif';
    context.fillText('Muévete con técnica. Respira en cada repetición.', width * 0.08, height * 0.93);
    if (scheduleNext) this.animationFrameId = requestAnimationFrame((nextTime) => this.draw(nextTime));
  }

  private drawSquat(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    floorY: number,
    rep: number,
    lineWidth: number,
    radius: number,
    accent: string,
  ): void {
    const centerX = width * 0.52;
    const depth = rep * height * 0.12;
    const hipX = centerX + width * 0.025 * rep;
    const hipY = height * 0.58 + depth;
    const shoulder = { x: centerX, y: height * 0.37 + depth * 0.55 };
    const hip = { x: hipX, y: hipY };
    const kneeLeft = { x: centerX - width * 0.13, y: height * 0.68 + depth * 0.45 };
    const kneeRight = { x: centerX + width * 0.13, y: height * 0.68 + depth * 0.45 };
    this.drawLine(context, centerX, height * 0.23 + depth * 0.55, centerX, shoulder.y, '#edf2e9', lineWidth * 1.4);
    this.drawHead(context, centerX, height * 0.2 + depth * 0.55, radius, '#edf2e9');
    this.drawLine(context, shoulder.x, shoulder.y, centerX - width * 0.17, shoulder.y + height * 0.03, accent, lineWidth);
    this.drawLine(context, shoulder.x, shoulder.y, centerX + width * 0.16, shoulder.y + height * 0.03, accent, lineWidth);
    this.drawLimb(context, hip, kneeLeft, { x: centerX - width * 0.21, y: floorY - height * 0.04 }, lineWidth, radius, accent);
    this.drawLimb(context, hip, kneeRight, { x: centerX + width * 0.21, y: floorY - height * 0.04 }, lineWidth, radius, accent);
    this.drawBar(context, centerX - width * 0.2, centerX + width * 0.2, shoulder.y - 3, accent);
  }

  private drawPullUp(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    rep: number,
    lineWidth: number,
    radius: number,
    accent: string,
  ): void {
    const centerX = width * 0.52;
    const shoulderY = height * 0.39 - rep * height * 0.11;
    const shoulder = { x: centerX, y: shoulderY };
    const hip = { x: centerX + width * 0.02, y: shoulderY + height * 0.19 };
    const barY = height * 0.16;
    const elbowY = shoulderY - height * (0.1 + rep * 0.02);
    this.drawBar(context, centerX - width * 0.23, centerX + width * 0.23, barY, accent);
    this.drawLine(context, shoulder.x, shoulder.y, centerX, hip.y, '#edf2e9', lineWidth * 1.35);
    this.drawHead(context, centerX, shoulderY - height * 0.12, radius, '#edf2e9');
    this.drawLimb(context, shoulder, { x: centerX - width * 0.11, y: elbowY }, { x: centerX - width * 0.2, y: barY }, lineWidth, radius, accent);
    this.drawLimb(context, shoulder, { x: centerX + width * 0.11, y: elbowY }, { x: centerX + width * 0.2, y: barY }, lineWidth, radius, accent);
    this.drawLimb(context, hip, { x: centerX - width * 0.07, y: hip.y + height * 0.15 }, { x: centerX - width * 0.08, y: hip.y + height * 0.28 }, lineWidth, radius, accent);
    this.drawLimb(context, hip, { x: centerX + width * 0.08, y: hip.y + height * 0.15 }, { x: centerX + width * 0.09, y: hip.y + height * 0.28 }, lineWidth, radius, accent);
  }

  private drawDip(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    rep: number,
    lineWidth: number,
    radius: number,
    accent: string,
  ): void {
    const centerX = width * 0.52;
    const shoulderY = height * 0.37 + rep * height * 0.08;
    const shoulder = { x: centerX, y: shoulderY };
    const hip = { x: centerX, y: shoulderY + height * 0.2 };
    const elbowY = shoulderY + height * (0.04 + rep * 0.06);
    const barY = height * 0.48;
    this.drawBar(context, centerX - width * 0.23, centerX + width * 0.23, barY, '#81917d');
    this.drawLine(context, centerX, shoulderY - height * 0.12, centerX, hip.y, '#edf2e9', lineWidth * 1.35);
    this.drawHead(context, centerX, shoulderY - height * 0.16, radius, '#edf2e9');
    this.drawLimb(context, shoulder, { x: centerX - width * 0.13, y: elbowY }, { x: centerX - width * 0.2, y: barY }, lineWidth, radius, accent);
    this.drawLimb(context, shoulder, { x: centerX + width * 0.13, y: elbowY }, { x: centerX + width * 0.2, y: barY }, lineWidth, radius, accent);
    this.drawLimb(context, hip, { x: centerX - width * 0.07, y: hip.y + height * 0.15 }, { x: centerX - width * 0.1, y: hip.y + height * 0.27 }, lineWidth, radius, accent);
    this.drawLimb(context, hip, { x: centerX + width * 0.07, y: hip.y + height * 0.15 }, { x: centerX + width * 0.1, y: hip.y + height * 0.27 }, lineWidth, radius, accent);
  }

  private drawPushUp(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    floorY: number,
    rep: number,
    lineWidth: number,
    radius: number,
    accent: string,
  ): void {
    const floor = floorY - height * 0.04;
    const head = { x: width * 0.35, y: floor - height * (0.31 - rep * 0.06) };
    const shoulder = { x: width * 0.43, y: head.y + height * 0.03 };
    const hip = { x: width * 0.61, y: floor - height * 0.13 };
    const knee = { x: width * 0.72, y: floor - height * 0.08 };
    const ankle = { x: width * 0.83, y: floor - height * 0.03 };
    const elbowY = floor - height * (0.1 + rep * 0.03);
    this.drawHead(context, head.x, head.y, radius, '#edf2e9');
    this.drawLine(context, shoulder.x, shoulder.y, hip.x, hip.y, '#edf2e9', lineWidth * 1.35);
    this.drawLimb(context, shoulder, { x: width * 0.45, y: elbowY }, { x: width * 0.48, y: floor }, lineWidth, radius, accent);
    this.drawLimb(context, hip, knee, ankle, lineWidth, radius, accent);
    this.drawLimb(context, hip, { x: knee.x + 3, y: knee.y + 3 }, { x: ankle.x + 3, y: ankle.y + 2 }, lineWidth * 0.75, radius * 0.75, '#98ac87');
  }

  private drawDeadlift(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    floorY: number,
    rep: number,
    lineWidth: number,
    radius: number,
    accent: string,
  ): void {
    const centerX = width * 0.52;
    const hinge = rep * height * 0.14;
    const shoulder = { x: centerX - width * 0.06 - hinge * 0.25, y: height * 0.37 + hinge * 0.45 };
    const hip = { x: centerX + width * 0.03 + hinge * 0.12, y: height * 0.58 + hinge * 0.2 };
    const kneeLeft = { x: centerX - width * 0.11, y: height * 0.69 + hinge * 0.1 };
    const kneeRight = { x: centerX + width * 0.12, y: height * 0.69 + hinge * 0.1 };
    const barY = height * 0.74 - rep * height * 0.15;
    this.drawLine(context, shoulder.x, shoulder.y, hip.x, hip.y, '#edf2e9', lineWidth * 1.35);
    this.drawHead(context, shoulder.x - width * 0.02, shoulder.y - height * 0.13, radius, '#edf2e9');
    this.drawLimb(context, shoulder, { x: centerX - width * 0.14, y: barY - 8 }, { x: centerX - width * 0.11, y: barY }, lineWidth, radius, accent);
    this.drawLimb(context, shoulder, { x: centerX + width * 0.08, y: barY - 8 }, { x: centerX + width * 0.11, y: barY }, lineWidth, radius, accent);
    this.drawLimb(context, hip, kneeLeft, { x: centerX - width * 0.17, y: floorY - height * 0.04 }, lineWidth, radius, accent);
    this.drawLimb(context, hip, kneeRight, { x: centerX + width * 0.17, y: floorY - height * 0.04 }, lineWidth, radius, accent);
    this.drawBar(context, centerX - width * 0.23, centerX + width * 0.23, barY, accent);
  }

  private drawBenchPress(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    floorY: number,
    rep: number,
    lineWidth: number,
    radius: number,
    accent: string,
  ): void {
    const centerX = width * 0.52;
    const head = { x: centerX - width * 0.19, y: height * 0.61 };
    const shoulder = { x: centerX - width * 0.1, y: height * 0.62 };
    const hip = { x: centerX + width * 0.11, y: height * 0.62 };
    const barY = height * (0.39 - rep * 0.08);
    const elbowY = height * (0.54 - rep * 0.04);
    context.strokeStyle = '#66745f';
    context.lineWidth = lineWidth * 0.85;
    context.beginPath();
    context.moveTo(width * 0.27, height * 0.69);
    context.lineTo(width * 0.76, height * 0.69);
    context.stroke();
    this.drawHead(context, head.x, head.y, radius, '#edf2e9');
    this.drawLine(context, shoulder.x, shoulder.y, hip.x, hip.y, '#edf2e9', lineWidth * 1.35);
    this.drawLimb(context, shoulder, { x: centerX - width * 0.02, y: elbowY }, { x: centerX - width * 0.03, y: barY }, lineWidth, radius, accent);
    this.drawLimb(context, shoulder, { x: centerX + width * 0.03, y: elbowY }, { x: centerX + width * 0.04, y: barY }, lineWidth, radius, accent);
    this.drawLimb(context, hip, { x: centerX + width * 0.15, y: height * 0.72 }, { x: centerX + width * 0.2, y: floorY - height * 0.04 }, lineWidth, radius, accent);
    this.drawLimb(context, hip, { x: centerX + width * 0.04, y: height * 0.72 }, { x: centerX + width * 0.02, y: floorY - height * 0.04 }, lineWidth, radius, '#98ac87');
    this.drawBar(context, centerX - width * 0.18, centerX + width * 0.18, barY, accent);
  }

  private drawHead(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
  ): void {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  private drawLine(
    context: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number,
  ): void {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  private drawLimb(
    context: CanvasRenderingContext2D,
    start: { x: number; y: number },
    joint: { x: number; y: number },
    end: { x: number; y: number },
    width: number,
    radius: number,
    color: string,
  ): void {
    this.drawLine(context, start.x, start.y, joint.x, joint.y, color, width);
    this.drawLine(context, joint.x, joint.y, end.x, end.y, color, width);
    this.drawHead(context, joint.x, joint.y, radius * 0.55, color);
  }

  private drawBar(
    context: CanvasRenderingContext2D,
    left: number,
    right: number,
    y: number,
    color: string,
  ): void {
    this.drawLine(context, left, y, right, y, color, 3);
    this.drawHead(context, left, y, 3, color);
    this.drawHead(context, right, y, 3, color);
  }
}
