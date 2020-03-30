import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Statistic } from 'src/app/models/Statistic';
import { ChartCanvasComponent } from './chart-canvas/chart-canvas.component';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss']
})
export class StatisticComponent  {
  @ViewChild('count_chart') countChart;
  @ViewChild('speed_chart') speedChart;
  @ViewChild('mortality_chart') mortalityChart;
  @ViewChild('growth_chart') growthChart;

  public colorPopulation = "#F0A040"
  public colorSpeed = "#6060F0";
  public colorMortality = "#501090"
  public colorGrowth = "#40F040";

  constructor() { }
  
  public take(statistics? : Statistic[]): void {
    this.countChart.draw(statistics.map(t => t.creaturesCount));
    this.speedChart.draw(statistics.map(t => t.avgSpeed));
    this.mortalityChart.draw(statistics.map(t => t.deathsPerDay));
    // yes! I know
    this.growthChart.draw(statistics.map(t => t.creaturesCount - t.deathsPerDay));
  }
}
