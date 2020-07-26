import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { VMComponent } from 'src/app/vm/vm.component';
import { PageNotFoundComponent } from './page-not-found.component';
import { StudentsContComponent } from './teacher/students-cont.component';

import { TeacherGuard } from './auth/teacher.guard';
import { StudentGuard } from './auth/student.guard';


const routes: Routes = [

    {
        path: 'student',
        canActivate: [StudentGuard],
        children: 
        [
            // { path: 'teams', component:  },
            // { path: 'vms', component:  },

        ]

    },
    {
        path: "teacher",
        canActivate: [TeacherGuard],
        children: [
            { path: 'course/:course_name/students', component: StudentsContComponent },
            { path: 'course/:course_name/vms', component: VMComponent },
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