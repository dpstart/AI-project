import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule} from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { StudentsComponent } from './teacher/students-container/students.component';
import { StudentsContComponent } from './teacher/students-container/students-cont.component';
import { AppRoutingModule } from './app-routing-module';
import { HomeComponent } from './home.component';
import { PageNotFoundComponent } from './page-not-found.component';
import { VMComponent } from 'src/app/teacher/vm/vm.component';
import { MatDialogModule } from '@angular/material/dialog';
import { LoginDialogComponent } from './auth/login-dialog.component';
import { TokenInterceptor } from './auth/token.interceptor';
import { RegisterDialogComponent } from './auth/register-dialog.component';
import { TeacherGuard } from './auth/teacher.guard';
import { StudentGuard } from './auth/student.guard';
import { VmStudentComponent } from './student/vm/vm-student.component';
import { EditTeamDialogComponent } from './teacher/vm/edit/edit-team-dialog.component';
import { EditVmDialogComponent } from './student/vm/edit/edit-vm-dialog.component';
import { GroupsComponent } from './student/groups/groups.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { HomeworkComponent } from './shared-components/homework/homework.component';
import { HomeworkDialogComponent } from './shared-components/homework/dialog/homework-dialog.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeworkContainerComponent } from './shared-components/homework-container/homework-container.component';
import { CreateDialogComponent } from 'src/app/student/vm/create/create-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';

@NgModule({
  declarations: [
    AppComponent,
    StudentsComponent,
    StudentsContComponent,
    HomeComponent,
    PageNotFoundComponent,
    VMComponent,
    LoginDialogComponent,
    RegisterDialogComponent,
    HomeworkComponent,
    VmStudentComponent,
    EditTeamDialogComponent,
    EditVmDialogComponent,
    GroupsComponent,
    HomeworkDialogComponent,
    HomeworkContainerComponent,
    CreateDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatButtonModule,
    MatTabsModule,
    MatListModule,
    MatTableModule,
    MatCheckboxModule,
    MatInputModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatSortModule,
    HttpClientModule,
    AppRoutingModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    NgbModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  entryComponents: [LoginDialogComponent],
  providers: [
    TeacherGuard,
    StudentGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }, {
      provide: MAT_DATE_LOCALE,
      useValue: 'it'
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
