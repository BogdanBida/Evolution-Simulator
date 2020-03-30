import { Component, OnInit, ViewChild } from '@angular/core';
import { Food } from '../models/Food';
import { Creature } from '../models/Creature';
import { CanvasComponent } from './canvas/canvas.component';
import { Dot } from '../models/Dot';
import { Statistic } from '../models/Statistic';
import { World } from '../models/World';
import { JsonSerializationService } from '../services/json-serialization.service';
import { ChartCanvasComponent } from './statistic/chart-canvas/chart-canvas.component';
import { StatisticComponent } from './statistic/statistic.component';

@Component({
  selector: 'app-home-controller',
  templateUrl: './home-controller.component.html',
  styleUrls: ['./home-controller.component.scss']
})
export class HomeControllerComponent implements OnInit {

  @ViewChild(CanvasComponent) canvas: CanvasComponent;
  @ViewChild(StatisticComponent) statisticComponent: StatisticComponent;
  
  public isShowProcess: boolean = true;
  public isShowStatistic: boolean = true;

  private standartSizeW: number = 700;
  private standartSizeH: number = 600;
  private idLifeLoop;
  public isPause: boolean = true;
  
  public message: string = "Hello";

  public day: number;
  public step: number;
  public readonly stepsPerDay: number = 100;
  public maxDay: number = 365;
  public dayDurationMS = 0;
  public readonly minDayDuration: number = 0;
  public readonly maxDayDuration: number = 5000;
  
  
  public creatures: Creature[];
  public creaturesStartCount: number = 2;
  public food: Food[];
  public foodUnits: number = 10;
  private FOOD_VALUE: number = 80;
  
  private burnoutLimit = 25;
  private energyLimit = 200;
  private koeff = 50;
  
  public speedAVG: number = 0;
  public deathsPerDay: number = 0;

  public statistics: Statistic[] = [];

  constructor(private jsonService: JsonSerializationService) {
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
        Math.random() * 2 + 4); // speed
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
    this.submitStatistic();
  }

  public nextDay() {
    this.day++;
    this.deathsPerDay = 0;
    if ((this.day > this.maxDay)) {
      this.pause();
    }

    // next day logic
    this.creatures.forEach(creature => {
      creature.target = null;
      if (creature.energy > 100) {
        this.createCreatureFrom(creature);
      }
      if (creature.energy < 5) {
        this.killCreature(creature);
        this.deathsPerDay++;
      }
    });
    if (this.creatures.length == 0 && this.day > 1) {
      this.message = "World is die";
      this.pause();
    }
    // ------------------------------------------ init statistics
    let statistic: Statistic = new Statistic();
    statistic.creaturesCount = this.creatures.length;
    statistic.avgSpeed = this.speedAVG;
    statistic.deathsPerDay = this.deathsPerDay;
    this.statistics.push(statistic);
    this.submitStatistic();
  }

  public async nextStep() {
    this.step++;
    if (this.step == 1) {
      if (this.day == 1) {
        this.initCreatures(this.creaturesStartCount);
      }
      this.initFood(this.foodUnits);
    }

    // step logic
    this.speedAVG = 0;
    this.creatures.forEach(creature => {
      this.speedAVG += creature.speed / this.creatures.length;
      this.creatureLifeLogic(creature);
    });
    if (this.step > this.stepsPerDay) {
      this.step = 0;
      this.nextDay();
    }
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
      this.deathsPerDay++;
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
    let chance = 0.5;
    if (Math.random() > (1 - chance)) {
      // --------------------------------------------- REPRODUCTION
      parent.energy -= 90;
      let D = 16;
      let newCreature = new Creature(
        parent.x + Math.random()*D + D/2, // x 
        parent.y + Math.random()*D - D/2,  // y
        parent.speed + (Math.random() - 0.5)/2); // speed
      
        // newCreature.name = `${parent.name}_${Math.round(Math.random()*10)}`;
      newCreature.name = String(Math.round(Math.random() * 100));
      this.creatures.push(newCreature)
    }
  }

  public killCreature(creature: Creature) {
    let id = this.creatures.indexOf(creature, 0);
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
    this.jsonService.saveToJSONFile(world);
  }
  
  public loadWorld(files) {
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
          this.submitStatistic();
        } catch (e) {
          this.message = e;
        }
      });
    } else {
      this.message = "File is not found";
    }
  }

  public async submitStatistic() {
    if (this.statisticComponent) {
      this.statisticComponent.take(this.statistics);
    } else {
      await new Promise(resolve => {
        setTimeout(res => { this.statisticComponent.take(this.statistics) }, 0);
      })
    }
  }
}
