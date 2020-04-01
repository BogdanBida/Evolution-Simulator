import { Food } from './Food';
import { Dot } from './Dot';

export class Creature {
    public x: number;
    public y: number;
    public speed: number;
    public currentSpeed: number;
    public energy: number;
    public target: Food | Dot;

    constructor(x: number, y: number, speed: number) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.currentSpeed = speed;
        this.energy = 50;
    }

    public moveToTarget(): boolean {
        let differenceX = this.target.x - this.x;
        let differenceY = this.target.y - this.y
        let dx = this.currentSpeed;
        let dy = this.currentSpeed;
        let absDiffX = Math.abs(differenceX);
        let absDiffY = Math.abs(differenceY);
        dx *= (absDiffX < absDiffY ? (absDiffX / absDiffY) : 1);
        dy *= (absDiffY < absDiffX ? (absDiffY / absDiffX) : 1);
        this.x += Math.round((differenceX > 0) ? dx : -dx);
        this.y += Math.round((differenceY > 0) ? dy : -dy);

        this.energy -= (this.currentSpeed * 1.2) / 15;
        if (Math.abs(this.x - this.target.x) < dx && Math.abs(this.y - this.target.y) < dy) 
            return true;
        return false;
    }

    public findFood(food: Food[]) {
        let len = Infinity;
        food.forEach(foodItem => {
            let t = Math.hypot(foodItem.x - this.x, foodItem.y - this.y);
            if (t < len) {
                len = t;
                this.target = foodItem;
            }
        });
    }
}