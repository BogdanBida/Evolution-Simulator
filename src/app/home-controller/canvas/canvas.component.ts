import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Creature } from 'src/app/models/Creature';
import { Food } from 'src/app/models/Food';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit {

  private canvas;
  private canvasFront;
  private ctx;
  private ctxFront;
  private readonly maxFPS = 60;
  private idUpdating;

  private creatureColor: string = "#F04141";
  private foodColor: string = "#50F050";

  private W: number
  public getW() {
    return this.W;
  }
  private H: number;
  public getH() {
    return this.H;
  }

  @Input() creatures: Creature[];
  @Input() food: Food[];

  constructor() { }

  ngOnInit() {
    this.canvas = document.getElementById('canvas');
    this.canvasFront = document.getElementById('canvas-front');
    this.ctx = this.canvas.getContext('2d');
    this.ctxFront = this.canvasFront.getContext('2d');
    this.resizeCanv();
    this.startDrawing();
    this.ctxFront.font = "16px Tahoma bold"
    this.ctxFront.fillStyle = this.ctxFront.strokeStyle =  "white";
    this.ctxFront.setLineDash([1,4]);
  }

  private resizeCanv() {
    this.W = this.canvas.clientWidth * window.devicePixelRatio;
    this.H = this.canvas.clientHeight * window.devicePixelRatio;
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.canvasFront.width = this.W;
    this.canvasFront.height = this.H;
  }

  private async startDrawing() {
    
    await new Promise(resolve => {
      setInterval( ()=> {
        this.update();
      }, 1000 / this.maxFPS)
    });
  }

  private update() {
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.ctx.fillStyle = this.creatureColor;
    if (this.creatures)
    this.creatures.forEach(creature => {
      this.ctx.beginPath();
      this.ctx.arc(Math.round(creature.x), Math.round(creature.y), 5, 0, Math.PI*2); // draw Creation
      // this.ctx.fillText(creature.name, creature.x, creature.y - 8);
      this.ctx.closePath();
      this.ctx.fill();
    });
    this.ctx.fillStyle = this.foodColor;
    if (this.food)
    this.food.forEach(item => {
      this.ctx.beginPath();
      this.ctx.arc(Math.round(item.x), Math.round(item.y), 4, 0, Math.PI*2); // draw Food
      this.ctx.closePath();
      this.ctx.fill();
    })
  }

  public stopDrawing() {
    clearInterval(this.idUpdating);
  }

  private readonly mouseR = 12;
  private doubleClickTime = false;
  public async mouseHover(event) {
    this.ctxFront.clearRect(0,0,this.W, this.H);
    let x = event.offsetX;
    let y = event.offsetY;
    if (this.doubleClickTime) return;
    this.ctxFront.beginPath();
    this.ctxFront.moveTo(0, y)
    this.ctxFront.lineTo(x - this.mouseR, y);
    this.ctxFront.fillText(x + "x", 6, 24);
    this.ctxFront.moveTo(x, 0)
    this.ctxFront.lineTo(x, y - this.mouseR);
    this.ctxFront.fillText(y + "y", 6, 48);
    this.ctxFront.stroke();
    this.ctxFront.closePath();
    this.doubleClickTime = true;
    await new Promise(res => { setTimeout(() => { this.doubleClickTime=false },250) })
  }
}
