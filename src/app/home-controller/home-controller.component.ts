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
export class HomeControllerComponent {

  @ViewChild(CanvasComponent) canvas: CanvasComponent;
  @ViewChild(StatisticComponent) statisticComponent: StatisticComponent;

  public isShowProcess: boolean = true;
  public isShowStatistic: boolean = true;
  public instantCalk: boolean = false;

  private standartSizeW: number = 600;
  private standartSizeH: number = 600;
  private idLifeLoop;
  public isPause: boolean = true;

  public message: string = "Hello";

  public day: number = 0;
  public step: number = 0;
  public readonly stepsPerDay: number = 100;
  public maxDay: number = 365;
  public dayDurationMS = 0;
  public readonly minDayDuration: number = 0;
  public readonly maxDayDuration: number = 5000;


  public creatures: Creature[] = [];
  public creaturesStartCount: number = 2;
  public food: Food[] = [];
  public foodUnits: number = 10;
  private FOOD_VALUE: number = 80;

  private burnoutLimit = 25;
  private energyLimit = 200;
  private koeff = 80;

  public speedAVG: number = 0;
  public deathsPerDay: number = 0;
  public growthPerDay: number = 0;

  public statistics: Statistic[] = [];

  constructor(private jsonService: JsonSerializationService) { }

  public initCreatures(N: number) {
    this.creatures = [];
    for (let i = 0; i < N; i++) {
      let creature = new Creature(
        Math.round(Math.random() * this.standartSizeW), //x 
        Math.round(Math.random() * this.standartSizeH), //y
        Math.random() * 2 + 2); // speed
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
    if (this.day == 0) {
      this.initCreatures(this.creaturesStartCount);
      this.nextDay();
    }
    await new Promise(resolve => {
      if (this.canvas) {
        this.standartSizeW = this.canvas.getW();
        this.standartSizeH = this.canvas.getH();
      }
      if (!this.instantCalk) {
        this.idLifeLoop = setInterval(() => {
          this.nextStep();
        }, this.dayDurationMS / this.stepsPerDay)
      } else {
        this.recursionInstantCalk();
      }
    });
  }

  private recursionInstantCalk() {
    if (this.day >= this.maxDay) {
      this.pause();
      this.message = "Calculation is done";
      return;
    }
    this.nextStep();
    this.recursionInstantCalk();
  }


  public pause() {
    this.delay = 0;
    this.startDate = null;
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
    this.speedAVG = 0;
    this.deathsPerDay = 0;
    this.statistics = [];
    this.submitStatistic();
    this.message = "World was destroy";
  }

  public delay: number = 0;
  private startDate: number = null;
  private endDate: number = null;

  public nextDay() {
    this.endDate = Date.now();
    this.delay = (this.endDate && this.startDate) ? this.endDate - this.startDate : 0;
    this.startDate = Date.now();

    this.day++;
    if ((this.day >= this.maxDay)) {
      this.pause();
      this.message = "Time is up"
      return;
    }
    this.initFood(this.foodUnits);
    // next day logic
    this.creatures.forEach(creature => {
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

    this.updateStatistic();
    this.message = `Growth: ${this.growthPerDay}; Deaths: ${this.deathsPerDay}`;
    this.deathsPerDay = 0;
    this.growthPerDay = 0;
  }

  public async nextStep() {
    this.step++;
    // step logic 
    this.speedAVG = 0;
    this.creatures.forEach(creature => {
      this.creatureLifeLogic(creature);
      this.speedAVG += creature.speed / this.creatures.length;
    });
    if (this.step >= this.stepsPerDay) {
      this.step = 0;
      this.nextDay();
    }
  }

  public creatureLifeLogic(creature: Creature) {
    creature.currentSpeed = creature.speed

    if (creature.energy < this.burnoutLimit) { // ** burnout. If creation energy < limit then hes speed decrease to 60% 
      creature.currentSpeed *= Math.sin(creature.energy * Math.PI / (this.burnoutLimit) - Math.PI / 2) / 2.5 + 0.6 // ** as sinusoid function from -Pi/2 to Pi/2 
    }
    if (creature.energy > this.energyLimit) {
      creature.currentSpeed *= this.koeff / (creature.energy + this.koeff - this.energyLimit);
    }
    if (creature.energy < 1) {
      this.killCreature(creature);
    }

    if (creature.target) {
      if (creature.moveToTarget()) { // ** if creature was faced with target then true
        if (creature.target instanceof Food) {
          let id = this.food.indexOf(creature.target, 0);
          if (id != -1) { //  todo: refactoring
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
    } else if (this.food.length > 0) {
      creature.findFood(this.food);
    } else {
      creature.target = new Dot(this.standartSizeW * Math.random(), this.standartSizeH * Math.random());
    }
  }

  public createCreatureFrom(parent: Creature) {
    let chance = 0.5;
    if (Math.random() > (1 - chance)) {
      // --------------------------------------------- REPRODUCTION
      parent.energy -= 90;
      let D = 16;
      let newCreature = new Creature(
        parent.x + Math.round(Math.random() * D + D / 2), // x 
        parent.y + Math.round(Math.random() * D - D / 2),  // y
        parent.speed + (Math.random() - 0.5) * 1); // speed

      this.creatures.push(newCreature);
      this.growthPerDay++;
    }
  }

  public killCreature(creature: Creature) {
    let id = this.creatures.indexOf(creature, 0);
    this.creatures.splice(id, 1);
    this.deathsPerDay++;
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

  public updateStatistic() {
    let statistic: Statistic = new Statistic();
    statistic.creaturesCount = this.creatures.length;
    statistic.avgSpeed = this.speedAVG;
    statistic.deathsPerDay = this.deathsPerDay;
    statistic.growth = this.growthPerDay;
    this.statistics.push(statistic);
    this.submitStatistic();
  }
}
