import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { VMComponent } from 'src/app/teacher/vm/vm.component';
import { PageNotFoundComponent } from './page-not-found.component';
import { StudentsContComponent } from './teacher/students-container/students-cont.component';

import { TeacherGuard } from './auth/teacher.guard';
import { StudentGuard } from './auth/student.guard';
import { VmStudentComponent } from './student/vm/vm-student.component';
import { GroupsComponent } from './student/groups/groups.component';
import { HomeworkContainerComponent } from './shared-components/homework-container/homework-container.component';
import { ConfirmTokenComponent } from './shared-components/token/confirm/confirm-token.component';
import { RejectTokenComponent } from './shared-components/token/reject/reject-token.component';
import { ActivateAccountComponent } from './shared-components/account/activate-account.component';



const routes: Routes = [

    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    {
        path: 'student',
        canActivate: [StudentGuard],
        children:
            [
                { path: 'course/:course_name/groups', component: GroupsComponent },
                { path: 'course/:course_name/vms', component: VmStudentComponent },
                { path: 'course/:course_name/homework', component: HomeworkContainerComponent }

            ]

    },
    {
        path: "teacher",
        canActivate: [TeacherGuard],
        children: [
            { path: 'course/:course_name/students', component: StudentsContComponent },
            { path: 'course/:course_name/vms', component: VMComponent },
            { path: 'course/:course_name/homework', component: HomeworkContainerComponent },
        ]
    },

    { path: '/activate/:token', component: ActivateAccountComponent },
    { path: '/confirm/:token', component: ConfirmTokenComponent },
    { path: '/reject/:token', component: RejectTokenComponent },
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