import { Component, OnInit } from '@angular/core';
import { RouteStateService } from './services/route-state.service';

@Component({
    selector: 'app-page-not-found',
    template: '<p>Page not found!</p>',
    styles: []
})
export class PageNotFoundComponent implements OnInit {

    constructor(private routeStateService :RouteStateService) { }

    ngOnInit(): void {
        this.routeStateService.updatePathParamState("404 - Page Not Found")
    }

}
