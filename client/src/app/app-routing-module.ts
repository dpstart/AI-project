import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { VMComponent } from 'src/app/teacher/vm/vm.component';
import { PageNotFoundComponent } from './page-not-found.component';
import { StudentsContComponent } from './teacher/students-cont.component';

import { TeacherGuard } from './auth/teacher.guard';
import { StudentGuard } from './auth/student.guard';
import { HomeworkComponent } from './teacher/homework/homework.component';
import { VmStudentComponent } from './student/vm/vm-student.component';
import { GroupsComponent } from './student/groups/groups.component';


const routes: Routes = [

    {
        path: 'student',
        canActivate: [StudentGuard],
        children:
            [
                { path: 'course/:course_name/groups', component: GroupsComponent },
                { path: 'course/:course_name/vms', component: VmStudentComponent },
                { path: 'course/:course_name/homework', component: HomeworkComponent }

            ]

    },
    {
        path: "teacher",
        canActivate: [TeacherGuard],
        children: [
            { path: 'course/:course_name/students', component: StudentsContComponent },
            { path: 'course/:course_name/vms', component: VMComponent },
            { path: 'course/:course_name/homework', component: HomeworkComponent },
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