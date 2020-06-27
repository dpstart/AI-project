import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    constructor(public auth: AuthService) { }
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        console.log(this.auth.getAccessToken());
        if (this.auth.getAccessToken() != undefined)
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${this.auth.getAccessToken()}`
                }
            });
        return next.handle(request.clone());
    }
}