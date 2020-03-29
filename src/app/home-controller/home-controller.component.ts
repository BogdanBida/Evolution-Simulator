import { Component, OnInit, ViewChild } from '@angular/core';
import { Food } from '../models/Food';
import { Creature } from '../models/Creature';
import { CanvasComponent } from './canvas/canvas.component';
import { Dot } from '../models/Dot';
import { Statistic } from '../models/Statistic';
import { World } from '../models/World';

@Component({
  selector: 'app-home-controller',
  templateUrl: './home-controller.component.html',
  styleUrls: ['./home-controller.component.scss']
})
export class HomeControllerComponent implements OnInit {

  @ViewChild(CanvasComponent) canvas: CanvasComponent;

  public isShowProcess: boolean = true;

  public creatures: Creature[];
  public food: Food[];

  private standartSizeW: number = 700;
  private standartSizeH: number = 600;

  public day: number;
  public step: number;
  public readonly stepsPerDay: number = 200;
  public maxDay: number = 365;
  public dayDurationMS = 1000;
  public readonly minDayDuration: number = 0;
  public readonly maxDayDuration: number = 5000;

  public stepDelay: number;

  public message: string = "Hello";

  private idLifeLoop;
  public isPause: boolean = true;
  public creaturesStartCount: number = 2;
  public foodUnits: number = 5;
  private FOOD_VALUE: number = 100;

  private burnoutLimit = 25;
  private energyLimit = 200;
  private koeff = 50;

  public speedAVG: number = 0;

  public statistics: Statistic[] = [];

  constructor() {
    this.day = 0;
    this.step = 0;
    this.creatures = [];
  }

  ngOnInit() {
  }

  public initCreatures(N: number) {
    this.creatures = [];
    for (let i = 0; i < N; i++) {
      let creature = new Creature(
        Math.random() * this.standartSizeW, //x 
        Math.random() * this.standartSizeH, //y
        Math.random() * 2 + 2); // speed
      creature.name = String(i);
      this.creatures.push(creature);
    }
  }

  public initFood(N: number) {
    this.food = []
    for (let i = 0; i < N; i++) {
      let foodItem = new Food();
      foodItem.x = Math.random() * this.standartSizeW;
      foodItem.y = Math.random() * this.standartSizeH;
      this.food.push(foodItem);
    }
  }


  public async start() {
    this.isPause = false;
    this.message = "Start!"
    if (this.day == 0) this.nextDay();
    await new Promise(resolve => {
      if (this.canvas) {
        this.standartSizeW = this.canvas.getW();
        this.standartSizeH = this.canvas.getH();
      }
      this.idLifeLoop = setInterval(() => {
        this.nextStep();
      }, this.dayDurationMS / this.stepsPerDay)
    });
  }

  public pause() {
    clearInterval(this.idLifeLoop);
    if (this.canvas)
      this.canvas.stopDrawing();
    this.isPause = true;
  }

  public reset() {
    this.pause();
    this.day = 0;
    this.step = 0;
    this.creatures = [];
    this.food = [];
    this.statistics = [];
  }

  public nextDay() {
    this.day++;
    if ((this.day > this.maxDay)) {
      this.pause();
    }
    this.speedAVG = 0;

    // next day logic
    this.creatures.forEach(creature => {
      this.speedAVG += creature.speed / this.creatures.length;
      creature.target = null;

      if (creature.energy > 100) {
        this.createCreatureFrom(creature);
      }
      if (creature.energy < 5) {
        this.killCreature(creature);
      }
    });

    if (this.creatures.length == 0 && this.day > 1) {
      this.message = "World is die";
      this.pause();
    }
    let statistic: Statistic = new Statistic();
    statistic.creaturesCount = this.creatures.length;
    statistic.avgSpeed = this.speedAVG;
    this.statistics.push(statistic);
  }

  public async nextStep() {
    let dateStart = Date.now();
    this.step++;
    if (this.step == 1) {
      if (this.day == 1) {
        this.initCreatures(this.creaturesStartCount);
      }
      this.initFood(this.foodUnits);
    }
    // step logic
    this.creatures.forEach(creature => {
      this.creatureLifeLogic(creature);
    });
    if (this.step > this.stepsPerDay) {
      this.step = 0;
      this.nextDay();
    }
    let dateEnd = Date.now();
    this.stepDelay = dateEnd - dateStart;
  }

  public creatureLifeLogic(creature: Creature) {
    let currentSpeed = creature.speed;

    if (creature.energy < this.burnoutLimit) { //------------- burnout. If creation energy < limit then hes speed decrease to 20% 
      currentSpeed *= Math.sin(creature.energy * Math.PI / (this.burnoutLimit) - Math.PI / 2) / 2.5 + 0.6 // as sinusoid function from -Pi/2 to Pi/2 
    }
    if (creature.energy > this.energyLimit) {
      currentSpeed *= this.koeff / (creature.energy + this.koeff - this.energyLimit);
    }
    if (creature.energy < 1) {
      this.killCreature(creature);
    }

    if (creature.target) { // ------------------------------------------- if the creature found food
      // moving
      let differenceX = creature.target.x - creature.x;
      let differenceY = creature.target.y - creature.y
      let dx = currentSpeed;
      let dy = currentSpeed;
      let absDiffX = Math.abs(differenceX);
      let absDiffY = Math.abs(differenceY);
      dx *= (absDiffX < absDiffY ? (absDiffX / absDiffY) : 1);
      dy *= (absDiffY < absDiffX ? (absDiffY / absDiffX) : 1);
      creature.x += (differenceX > 0) ? dx : -dx;
      creature.y += (differenceY > 0) ? dy : -dy;
      // energy spendings 
      creature.energy -= (currentSpeed * 1.2) / 15;
      // collisions
      if (Math.abs(creature.x - creature.target.x) < dx && Math.abs(creature.y - creature.target.y) < dy) {
        if (creature.target instanceof Food) {
          let id = this.food.indexOf(creature.target, 0);
          if (id != -1) {
            creature.energy += this.FOOD_VALUE;
            this.creatures.forEach(creature => {
              if (creature.target == this.food[id])
                creature.target = null;
            })
            this.food.splice(id, 1);
          }
        } else {
          creature.target = new Dot(this.standartSizeW * Math.random(), this.standartSizeH * Math.random());
        }
      }
    } else if (this.food.length > 0) { // food search
      this.findFoodForCreature(creature);
    } else {
      creature.target = new Dot(this.standartSizeW * Math.random(), this.standartSizeH * Math.random());
    }
  }

  public findFoodForCreature(creature: Creature) {
    let len = Infinity;
    this.food.forEach(foodItem => {
      let t = Math.sqrt(Math.pow(foodItem.x - creature.x, 2) + Math.pow(foodItem.y - creature.y, 2))
      if (t < len) {
        len = t;
        creature.target = foodItem;
      }
    });
  }

  public createCreatureFrom(parent: Creature) {
    let chance = 0.9;
    if (Math.random() > (1 - chance)) {
      // --------------------------------------------- REPRODUCTION
      parent.energy -= 80;
      let newCreature = new Creature(parent.x, parent.y, parent.speed + Math.random() - 0.5);
      // newCreature.name = `${parent.name}_${Math.round(Math.random()*10)}`;
      newCreature.name = String(Math.round(Math.random() * 100));
      this.creatures.push(newCreature)
      this.message = `Last born creature! name: ${newCreature.name}`;
    }
  }

  public killCreature(creature: Creature) {
    let id = this.creatures.indexOf(creature, 0);
    this.message = `${creature.name} is dead, he was number ${id}`;
    this.creatures.splice(id, 1);
  }

  public saveWorld() {
    let world = new World();
    world.creatures = this.creatures;
    world.food = this.food;
    world.foodUnits = this.foodUnits
    world.day = this.day;
    world.step = this.step;
    world.lastDay = this.maxDay;
    world.statistics = this.statistics;

    let json = JSON.stringify(world);

    let type = 'data:application/octet-stream;base64, ';
    let base = btoa(json);
    let res = type + base;

    let a = document.createElement('a');
    a.setAttribute('href', res);
    a.setAttribute('download', 'world.json');
    a.click();
  }

  public loadWorld(files: FileList) {
    if (files.length > 0) {
      files[0].text().then(text => {
        try {
          let world: World = JSON.parse(text);
          this.creatures = world.creatures;
          this.food = world.food;
          this.foodUnits = world.foodUnits;
          this.day = world.day;
          this.step = world.step;
          this.maxDay = world.lastDay;
          this.statistics = world.statistics;
          this.message = "World is loaded";
        } catch (e) {
          this.message = e;
        }
      });
    } else {
      this.message = "File is not found";
    }
  }

  public getMaxCount() {
    let max = this.statistics[0].creaturesCount;
    this.statistics.forEach(t => {
      if (t.creaturesCount > max) {
        max = t.creaturesCount;
      }
    })
    return max;
  }
}
