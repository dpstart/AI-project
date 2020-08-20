import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RouteStateService {

  private pathParamState: BehaviorSubject<string>

  pathParam: Observable<string> //read-only Observable exposed outside

  constructor() {
    this.pathParamState = new BehaviorSubject<string>('Home') //remembers last value
    this.pathParam = this.pathParamState.asObservable() 
  }


  updatePathParamState(newPathParam: string) {
    this.pathParamState.next(newPathParam)
  }
}
