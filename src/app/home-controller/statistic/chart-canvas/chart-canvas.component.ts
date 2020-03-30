import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Statistic } from 'src/app/models/Statistic';

@Component({
  selector: 'app-chart-canvas',
  templateUrl: './chart-canvas.component.html',
  styleUrls: ['./chart-canvas.component.css']
})
export class ChartCanvasComponent implements AfterViewInit {

  @ViewChild('canvas') canvas: ElementRef;

  constructor() { }

  ngAfterViewInit(): void {
    this.nativeCanvas = this.canvas.nativeElement;
    this.initCtx
  }

  public initCtx() {
    this.ctx = this.nativeCanvas.getContext('2d');
  }

  private nativeCanvas;
  private r = 8;
  public ctx;
  public W;
  public H;
  public readonly marginW: number = 52;
  public readonly marginH: number = 16;
  @Input() dotColor: string;
  public lineColor = "#101010";


  private resize(): void {
    this.W = this.nativeCanvas.clientWidth;
    this.H = this.nativeCanvas.clientHeight;
    this.nativeCanvas.width = this.W;
    this.nativeCanvas.height = this.H;
    this.initCtx();
  }


  public draw(data: number[]): void {
    this.resize();

    this.ctx.clearRect(0, 0, this.W, this.H);
    let MinMax= this.getMinMax(data);
    let len = data.length;
    let step = (this.W - this.marginW) / (len-1);
    let workH = this.H - this.marginH;
    let x, y;

    this.ctx.strokeStyle = "#C0C0C0";
    this.ctx.moveTo(this.marginW, this.marginH);
    this.ctx.lineTo(this.marginW, workH + this.marginH);
    this.ctx.stroke();
    for (let i = 1; i < 4; i++) {
      this.ctx.moveTo(this.marginW, i*(workH / 4) + this.marginH);
      this.ctx.lineTo(this.W, i*(workH / 4) + this.marginH);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = this.lineColor;
    for (let i = 0; i < len; i++) {
      this.ctx.beginPath();
      if (x !== null && y !== null) this.ctx.moveTo(x, y);
      y = this.getY(data[i], MinMax[1], workH);
      x = this.getX(i, step);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.ctx.closePath();
    }
    this.r = 8;
    if (len > 10) this.r = 7
    if (len > 25) this.r = 6
    if (len > 50) this.r = 5
    if (len > 100) this.r = 4
    if (len > 150) this.r = 3
    if (len > 200) this.r = 2
    this.ctx.fillStyle = this.dotColor;
    if (len < 300)
      for (let i = len - 1; i >= 0; i--) {
        this.ctx.beginPath();
        y = this.getY(data[i], MinMax[1], workH);
        x = this.getX(i, step);
        this.ctx.arc(x, y, this.r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
      }
    this.ctx.font = "14px sans-serif"
    this.ctx.fillStyle = "#403030";
    this.ctx.fillText("0", 2, this.H - 4);
    this.ctx.fillText( Number(MinMax[1].toFixed(2)), 2, 14);
    let avg = this.getAVG(data);
    this.ctx.fillText(`AVG | ${Number(avg.toFixed(2))} =>`, this.marginW/3 + 2, this.getY(avg, MinMax[1], workH) + 4);
    this.ctx.stroke();
  }

  private getX(i: number, step: number): number {
    return step * i + this.marginW;
  }
  private getY(value: number, max: number, workH: number): number {
    return workH - workH * (value / max) + this.marginH;
  }


  private getAVG(data: number[]) {
    return data.reduce((total, n) => total + n / data.length);
  }

  private getMinMax(data: number[]): number[] {
    let max = data[0];
    let min = data[0];
    data.forEach(t => {
      if (t > max) {
        max = t;
      }
      if (t < min) {
        min = t;
      }
    })
    return [min,max];
  }
}
