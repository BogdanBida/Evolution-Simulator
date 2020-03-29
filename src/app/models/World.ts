import { Creature } from './Creature';
import { Food } from './Food';
import { Statistic } from './Statistic';

export class World {
    public day: number;
    public step: number;
    public lastDay: number;
    
    public creatures: Creature[];
    
    public food: Food[];
    public foodUnits: number;

    public statistics: Statistic[];
}