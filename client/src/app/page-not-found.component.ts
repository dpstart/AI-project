import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { RouteStateService } from './services/route-state.service';

@Component({
    selector: 'app-page-not-found',
    template: ' <mat-card><h1>Page not found!</h1></mat-card>',
    styles: ['mat-card{text-align:center; margin:20px}']
})
export class PageNotFoundComponent implements OnInit, OnDestroy {

    courseSub: Subscription
    
    constructor(private routeStateService: RouteStateService) { }

    ngOnInit(): void {
        this.courseSub = this.routeStateService.pathParam.subscribe(data => {
            if (data != "PageNotFound") {
                this.routeStateService.updatePathParamState("404 - Page Not Found")
            }
        })
    }

    ngOnDestroy(): void {
        this.courseSub.unsubscribe()
    }

}
