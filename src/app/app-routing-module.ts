import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { VMComponent } from 'src/vm.component';
import { PageNotFoundComponent } from './page-not-found.component';
import { StudentsContComponent } from './teacher/students-cont.component';

import { AuthGuard } from './auth/auth.guard';


const routes: Routes = [

    {
        path: "teacher/course", canActivate: [AuthGuard], children: [
            { path: 'applicazioni-internet/students', component: StudentsContComponent },
            { path: 'applicazioni-internet/vms', component: VMComponent },
        ]
    },
    { path: 'home', component: HomeComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', component: PageNotFoundComponent }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forRoot(routes)
    ],
    exports: [RouterModule],
    declarations: []
})
export class AppRoutingModule { }