import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HomeControllerComponent } from './home-controller/home-controller.component';
import { CanvasComponent } from './home-controller/canvas/canvas.component';

@NgModule({
   declarations: [
      AppComponent,
      CanvasComponent,
      HomeControllerComponent
   ],
   imports: [
      BrowserModule,
      FormsModule
   ],
   providers: [],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule { }
