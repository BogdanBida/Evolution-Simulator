import { Food } from './Food';
import { Dot } from './Dot';

export class Creature {
    public name: string;
    public x: number;
    public y: number;
    public speed: number;
    public energy: number;
    public target: Food | Dot;
    
    constructor(x: number, y: number, speed: number) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.energy = 50;
    }
}