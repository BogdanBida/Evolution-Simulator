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
  private ctx;
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
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanv();
    this.startDrawing();
  }

  private resizeCanv() {
    this.H = this.canvas.clientHeight;
    this.W = this.canvas.clientWidth;
    this.canvas.width = this.W;
    this.canvas.height = this.H;
  }

  private startDate;
  private endDate;

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
      this.ctx.arc(creature.x, creature.y, 5, 0, Math.PI*2); // draw Creation
      // this.ctx.fillText(creature.name, creature.x, creature.y - 8);
      this.ctx.closePath();
      this.ctx.fill();
    });
    this.ctx.fillStyle = this.foodColor;
    if (this.food)
    this.food.forEach(item => {
      this.ctx.beginPath();
      this.ctx.arc(item.x, item.y, 4, 0, Math.PI*2); // draw Food
      this.ctx.closePath();
      this.ctx.fill();
    })
  }

  public stopDrawing() {
    clearInterval(this.idUpdating);
  }

}
