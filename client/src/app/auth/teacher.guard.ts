import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRoute, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class TeacherGuard implements CanActivate {
    constructor(public auth: AuthService, public router: Router) { }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!this.auth.isLoggedIn()) {

            this.router.navigate(['home'], { queryParams: { doLogin: true, redirect: state.url } });
            return false;
        }

        if (this.auth.isLoggedIn() && !this.auth.isRoleTeacher()) {
            this.router.navigate(['home']);
            return false;
        }

        return true;
    }
}