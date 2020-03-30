import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JsonSerializationService {

constructor() { }

  public saveToJSONFile(info: any) {
    let a = document.createElement('a');
    a.setAttribute('href', this.createJSONFile(info));
    a.setAttribute('download', 'world.json');
    a.click();
  }

  private createJSONFile(info: any) {
    let json = JSON.stringify(info);

    let type = 'data:application/octet-stream;base64, ';
    let base = btoa(json);
    return type + base;
  }

}
