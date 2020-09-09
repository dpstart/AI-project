import { Component, OnInit, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { RouteStateService } from 'src/app/services/route-state.service';
import { HomeworkVersion } from 'src/app/model/homework-version';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Homework } from 'src/app/model/homework.model';
import { Assignment } from 'src/app/model/assignment.model';
import { TeacherService } from 'src/app/services/teacher.service';
import { DomSanitizer } from '@angular/platform-browser';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from 'src/app/services/auth.service';
import { StudentService } from 'src/app/services/student.service';
import { Image } from 'src/app/model/image.model';
import { take } from 'rxjs/operators';


const options = { year: 'numeric', month: 'numeric', day: 'numeric' };

export interface HomeworkVersionDisplayed {
  position: number,
  id: number,
  content: any,
  deliveryDate: string
}

@Component({
  selector: 'app-homework-dialog',
  templateUrl: './homework-dialog.component.html',
  styleUrls: ['./homework-dialog.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class HomeworkDialogComponent implements OnInit {


  historyHomeworkDataSource: MatTableDataSource<HomeworkVersionDisplayed>

  historyHomeworkColumnsToDisplay: string[]
  courseName: string
  selectedAssignment: Assignment
  idSelectedHomework: number


  //image to be expanded
  expandedImage: any

  expandedElement: HomeworkVersionDisplayed | null;


  selectedFile: File;
  fileName: string

  isDisabled: boolean
  message: string;

  alertType: string

  isAllLoaded: boolean

  constructor(
    private _authService: AuthService,
    private teacherService: TeacherService,
    private studentService: StudentService,
    private routeStateService: RouteStateService,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data) {



    this.selectedAssignment = data.assignment
    this.idSelectedHomework = data.homework.homeworkId

    console.log(data.homework.state, data.homework.state === 'CONSEGNATO')

    this.historyHomeworkColumnsToDisplay = ['id', 'content', 'deliveryDate']


    if (this.authService.isRoleStudent()) {
      if (!data.homework.isFinal && data.homework.state !== 'CONSEGNATO') {
          this.historyHomeworkColumnsToDisplay.push('action');
      }
    }else{
      this.historyHomeworkColumnsToDisplay.push('action')
    } 
    
    this.historyHomeworkDataSource = new MatTableDataSource<HomeworkVersionDisplayed>()


    this.expandedImage = null


    this.isDisabled = true
    this.isAllLoaded = false
  }


  public get authService(): AuthService {
    return this._authService;
  }



  selectImageToExpand(element: HomeworkVersion) {
    if (element == this.expandedImage)
      this.expandedImage = null
    else
      this.expandedImage = element
  }

  ngOnInit(): void {
    this.routeStateService.pathParam.subscribe(courseName => {
      this.courseName = courseName
    })


    this.loadVersions();
  }

  private loadVersions() {
    this.teacherService.getHomeworkVersions(this.courseName, this.selectedAssignment.id, this.idSelectedHomework).subscribe((data) => {
      // this.httpClient.get('http://localhost:8080/image/get/' + this.imageName)
      //   .subscribe(
      //     res => {

      let retrieveResponse = data;

      let source: HomeworkVersionDisplayed[] = [];

      let position = 0;


      if (retrieveResponse.length != 0) {
        retrieveResponse.forEach(version => {


          this.teacherService.getResourceByUrl(version.links.find(link => link.rel === "image").href).subscribe((success: Image) => {




            let base64Data = success.picByte;
            let formattedImage = `data:${success.type};base64,` + '\n' + base64Data;
            let content = this.sanitizer.bypassSecurityTrustResourceUrl(formattedImage);

            let id = version.id;
            console.log(version.deliveryDate);

            let deliveryDate = new Date(version.deliveryDate).toLocaleDateString(undefined, options);

            source.push({ position, id, content, deliveryDate });
            position++;


            if (position == retrieveResponse.length) {
              this.historyHomeworkDataSource.data = [...source];
              this.isAllLoaded = true;
            }
          });
        });


      }
      else
        this.isAllLoaded = true;



    });
  }

  expandPanel(version: HomeworkVersionDisplayed) {
    this.expandedElement = this.expandedElement === version ? null : version
  }

  //Gets called when the user selects an image
  public onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0];
    this.fileName = this.selectedFile.name
    if (this.fileName)
      this.isDisabled = false
  }
  //Gets called when the user clicks on submit to upload the image
  onUpload() {

    //FormData API provides methods and properties to allow us easily prepare form data to be sent with POST HTTP requests.
    const uploadImageData = new FormData();
    uploadImageData.append('image', this.selectedFile, this.selectedFile.name);


    if (this.authService.isRoleTeacher()) {
      this.teacherService.reviewHomework(this.courseName, this.selectedAssignment.id, this.idSelectedHomework, uploadImageData).subscribe(
        (response) => {
          this.loadVersions()
          this.data.homework.state = "CONSEGNATO"
          this.historyHomeworkColumnsToDisplay.pop()
          this.alertType = "success"
          this.message = 'Image uploaded successfully';
        }, error => {
          this.alertType = "danger"
          this.message = 'Sorry something went wrong, try later...';
        }
      );
    } else if (this.authService.isRoleStudent()) {
      this.studentService.uploadHomework(this.courseName, this.selectedAssignment.id, uploadImageData).subscribe(
        (response) => {
          this.loadVersions()
          this.data.homework.state = "CONSEGNATO"
          this.historyHomeworkColumnsToDisplay.pop()
          this.alertType = "success"
          this.message = 'Image uploaded successfully';
        }, error => {
          this.alertType = "danger"
          this.message = 'Sorry something went wrong, try later...';
        }
      );
    }
  }





}















  // ,
        //   // 
        //   (_) => {


        //     let fakeValues = []

        //     let source: HomeworkVersionDisplayed[] = []

        //     fakeValues.push(new HomeworkVersion(1, "", new Date()))
        //     fakeValues.push(new HomeworkVersion(2, "", new Date()))

        //     let retrieveResponse = fakeValues;

        //     let position = 0;

        //     retrieveResponse.forEach(version => {
        //       let base64Data = version.content;

        //       /*FAKE IMAGE FOR THE MOMENT*/
        //       base64Data = `/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAwICRYVExgWFRUZGBgYGxgNGBoaGiQaGBoaKhktLCoa
        //     HygvNTc5LzI0MigpLkQvNDk9P0A/LThGTEY9TDc+Pz0BDA0NEw8SHRISHT0lJSU9PT09PUg9PT09
        //     PT09PTw9PT09PT09PT09PT09PT09PD09PT09PT1GRjw9PT09SD09PP/AABEIAMIBAwMBIgACEQED
        //     EQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAACBQYBB//EAEEQAAIBAwIDBQUFBwIGAgMAAAECEQAD
        //     IRIxBEFRBSJhcYEGEzKRoRSxwdHwFSNCUnLS4ZKyFkNTYoLxM2MHFyT/xAAaAQADAQEBAQAAAAAA
        //     AAAAAAAAAQIDBAUG/8QAJREAAgICAgMAAwEAAwAAAAAAAAECEQMhEjETQVEiMmEEFFJx/9oADAMB
        //     AAIRAxEAPwDgbbppfUCWIGghgApnMiDy/HqCPeHdAwLjUuZAME4MZ84NJcDZR7mm4+hYbveIXA9T
        //     FaLdkWChZeLQsBqCkATjaZ9MxnwgkANcucIdWlLwkHT30wZwdvTnjxzXpbgy23EKCeTJCryiQT13
        //     NLp2Xw7Irfa0UlVZlZTKnQsr6NqHPEHckAD8Dag6byti2wkhckwynJyN5BIjzoA0C3BnP79ZbYMu
        //     ARuTB2PIZj0odu5wveVluEam0urgOFnGNpImenLwBxXA8MurTfLwuoAAZbvQOexCg7YMzyrK00Aa
        //     /FtZx7rWMmQ7KYHICAPGZ8KBqHUVn6ammgDQ1DqKmodRWfpqaaANDUOoqah1FZ+mppoA0NQ6ipqH
        //     UVn6a1bPZtr7M157o1FW021IDK2uBO8zjGIGcwAQAWodRU1DqKsnZ1gqp+1opKqzKyNKsRlcTt1o
        //     PZVu011RfYrbzJHXx/XqNwAE1DqKmodRXv7Pt+8uKbwRB3rTt3g6E4YwJ23gSDggZhfjOFRCNF1b
        //     szOlSIjaZ6+FAB9Q6ipqHUVoHsbhvsvvfffvPde90+9txrgdzT8W5NK/szhztxiDaQbbTvnboIPz
        //     zigAOodRU1DqKFxfCIigpfS4SdOlVYECPiyPTeaZ4XsxX4R7sO1zWLKKpEAAAs7Dc9MRG+QDAAPU
        //     Ooqah1Fe2+Assin7UisVDMrI2D0kA/r0pTheGNxguAPiZiYCqN2Pl9dhJIFADWodRU1DqK9+y8M9
        //     xgt420GjSXUknGTA6H7+gry72faCkrxSMQuoKEYEmPhEjflQBNQ6ipqHUUbsHs23fZluMVIKKoDB
        //     ZmZJkHaBsOdev2Zw/vHU8UqBW0j/AJgI0jIIgHJI2G3jgACrLOcjnBAPoYP3VGInG3KSCY8TilOE
        //     FvWPezpzOneYwCc4ncgExMZrR4vsyyrspui13VuKGBcZYxkZEqAwBE94A7TQBW9ctlU0AhgO+TzO
        //     kbZPMMcAYjFeW2SG1STHcg4Bzvn6dYOwIIOP4O2gBTiEuychVKkY3z8vP5lVbYIJ1KN8GZPlgj5m
        //     gB3UOoqVnaalAGyvZadW+Yo6dj2oyX/1D+2mrazTAWvXWCD7R5Ev9E10xH9h2v5m/wBQ/KmeE9nO
        //     GYnW9wdIZQfqtOItGtpVP/PBqqIX+nIn2IXPZrh9QCtd8yy/gtVf2Zsgxqc+TD+2thUrU4K0pWWJ
        //     J6AD8qiWKEFfGzWObJN1yo5MezNiPiuT/Uv5VB7M2v5rnzH5V29hxbPdHnIFXu8UG+JEPmKx/C/1
        //     NuORr9zik9lLB3e5PIY++KufZOwMH30+DqR/trtLb2tMG1b+VHt9oBRCKojpUtw9QBRye5nAH2Vt
        //     dbvzH5VLfstw899rsf8AaVn6iu8u8UzGZUTzxNRRYnU6lj5mPpTvHW4i45L1M4b/AIUsM4CtdAJ0
        //     gsy/gK1v/wBd2DBDX45kugnqR3a6e3xyJi1ZVehiT8zmq3uPuvgj5VlOpVxVG2NSV8pWznG//H3C
        //     Lvd4j/Wn9tCb2F4Plc4kn+tP7a6BkuHdT64+VejhHIn7pqFFezTk/Rzi+wnCc7l9f/Jf7aE/sRw5
        //     aEe+Z2kr/aK6k2o+KZ86uHVeZFNJL0K2/ZyD+wtsAmbuN++n5V5b9iLZ/wCuB1lSP9tdb9pE/Apn
        //     qKJ9sAGVA8qrVfqTu/2OTf2DsiBrvEnpp/tqXPYCwDm648yp/Cuma87GZgeBpe6rNzNJQb9Dc0vZ
        //     hL7B8NEniH9NM0FvYa1OLrR4sJ/21unhTpktA5Z/Cpb4bSZaWHMCRVcKJ53owf8Agmwph77basFf
        //     vg0JvZLhtle83jKx/trpWddRhNOMQJPqa9UO+SMDaIocF20Cm+kzlbnspYGzXCOupf7aonsvaP8A
        //     Fc/1L/bXVXjpIUWwPGCPmTQ/eBZAAk7lefhmnxVdByd9nLn2YtTg3fmP7aqfZi0Dl3A8x/bXQ3NX
        //     SgnxpLGn6B5K9mCfZu3PxPH9Q/KhXOwbY5v4d4flXRe5dtlY/wAO1VPA3D/Dt3RR417oXkl6OYPZ
        //     CdX+Y/KpXS/su5zAryjhH6g8kvjM20uKatpQ7a00i16CZ5/E9VKMqV6i0dFp8iHHZFWjiYAqyWG6
        //     fdRRaI3FTyTLUWgSs0b0bhyP4hI+tTRV7YzUSSZpFtewycPrBIGB45qHhyOVQCiWiFPeyKxlF+mb
        //     RyLpoGV8auF8Jr25etjCqJMxqJn5TSly9zMVKi2W8iXQ0Sw5GB0zQ14kUlxfaH7lyukm2pbIjrE+
        //     cGDQ+E4ktq1qRBOwJAgSQSMY2gE01GN0+yHkl2ujdS5K/EsRqxk+tBHEctQ84pJCDsZ2+u1ECVSx
        //     IHmYe4y9Z8aAWHSauEr33dNY4oh5JMEG8KsLnhRRa6mKsttZ2LfQfSqdfCU5fQNhmLAaonwB/Ci3
        //     eDEsSXx4fXAp23wLEhgqj5/jRTwDnaPnWMsiT0zeONtb2ZItAwPhXkRE0a3ZGwLEmtNeyjjY0ZeB
        //     YbAVnLKn7NY4mvRgX+CYmYNeWuCJ5Gum+ykjNCZFXGx9BPzrLzJKjTxO7MM9mudvrUbs9UGYB6mt
        //     Zg5+EfLNJ3+z3c5D56VHlbK8f8EB7kfEZ8zQbnE2VMqmeW5++tMezZbcOPNh+Vef8KdWj1mjyL22
        //     NY36Rh8R2qxwvdA6QPupBuNffUTXX2/Z20mWBY+O3yoXEdkoIKcOGM84X5yKnywWkjTwSatnJfbX
        //     6mpXT/ssnewo8MGPrUpeaHwXgn9OQtim7a0G0KctLXrcjyeJZFo6LXiLRwtFgkRZoyiqAmaZtqet
        //     S2VRULVlSjBatppch0iqKOc+lS4EAJ72AelXihuMHng46+tS2PSOH7Z7Yb3srjQw1MCGUg9RAOxI
        //     ifXoi3tDca2lsFRpJhlnOcA+Ux9d63ePuC6PcWeHIXU11ncKqiB8czsJPKPOuVChTkDI9Qa4MknF
        //     vZq1FLoObjEwXJ7oXcnA5f4onCdqXkVkV+6ZYyBG2ZO+QOR+VJoyrknE58p3od1yXGknYzI5eNc6
        //     ck9MUYtujsuyH4i5ZmxaX4tLvr1NPguSJncn0rpLNlmUNGCA0yCPmDFfOOE7Yu2l0K6orEaiADJH
        //     I+Hhzro7ftMxtoiMzXVdWLkgI0iNJEzABnrI5V1QzuKDin+x1o4aBk/IE16vDTz+hn5RS/ZvGs1s
        //     a9asv7s6ssT1JgD5CKeW74t9K3U5srjAqvCsM4nyn8KMyGBgEjmcfhUW5/X8x+VWFsE/Cx84qG5P
        //     suKiuiIv8zNPRTTdp1UQFb1z+NUThp5Eeo/Kj2bQU8z55rGTRtFN9BrdxTvHrRPeoN2H1qrXkj4R
        //     9KF75QMop8hWVm9MI/FJycfI0C7fRt2UxtKf5qNeT/pD6VUuv/TX5kVNlJNlffz/AC/Ij8aut1zs
        //     VHnP51QgHZR8z+VTT0x6GpbNFEKwuj/mL6AUtca9/MD+vKrvcA3cj1IoRKHZj/qNJspRRU3b3n8q
        //     n2m7zt1c3Y/i+tBudoKNzPlUNlpJdsv9of8Alb6VKB+1E61KWyrj9PnvD3TWjauVnWLJrQs2jXuc
        //     j59xG7bUZZNDt2qZVaORPEtat00le8Hw+sxOw1GrOmkkdKz8iujTxuuXosBXsVUGrA0cieLKXGgE
        //     /r6VznG+0yQFVoc6rejeXGNJIEgzkGDPStvtHgffBVaNIOpgROofyjzO56da5XjOzXF53W2kIQwV
        //     gCCSyqWK7QQGweQG3POc36LjFezo/wBp2jaTWPdo8WXcQgQHBEyNiIIPjiuP7X7Htly9q7bKL3dC
        //     XAzAAfFvPpG4NC7bu8SttbNwuxaL5TJhoxPkOXLFZvZF57dwnWbcQrEqMITuAQdt4GSJjnWMpcuy
        //     1j0+LPLtkAaW1DOoTMwfTyqt3hyAdLTI2O8dB8+lNcezM7swOqSonMqOcknczzNL8LwbXF1lhoVg
        //     sSSwEScchg5OJxzrBJ2KN/euwIs3HUEgQIj8zFM27ZGZHjA3PifTerhhaDK6Fw/dRySCADuBscYO
        //     Y/Hfvdl2fs7lH95cCi+iW0ZrgUKdS3QAYEjDGIPqCmm+htOWkdb2ep92pLOxbvS8A+EAADYcvmd6
        //     fRa5z2b7aW4EW6UVNCqHnAaNjHQEiTGY6zXVa0CgKQ097UMyOUGuuOVOkhvBKNtktmKbtt0pZTVg
        //     tEqkKLaGRe60ZLnifnSMmvAxFYuHw3jkrs0oFVZaTHEkcpody7cO2PLlWdHSpqrSGWtzzqaTSFzi
        //     LiiSfoM17w/FuxEjEfXrSadWNTV1Q6TFBdjVHu+NCN0dak0tIlwTSzrVn4heRmqi6gywJ8KHaF+M
        //     vYB18aA6eNe8VxiajpEDzpN+LPSqUW0YSlBOuwhteNSlTxTdPpUquLI5R+Ctor1FNIw6is+1NN2b
        //     ZbYV3vRyVY4jjrTNu07LqCY++vOE4VQCX7x5DlW1wtxdAUiIGmufJl4/qdOLBy7YHsvhmXvtpAI2
        //     FD7TuENqG3PpTqwDHLpS3EcOHwTArCM7nykdEsVQ4xB8HZe4upQoA7uZya0k4ZAgBgnnHOvODZba
        //     BFG318a9e5JpSyNvXQ8eJRVvsS4oaCT/AA+mKWPEW8krlonAzG00zxVvWJgY60Dh7SsYgCtoyVWz
        //     myQfOo+wOmw0zb33BBgwMfQCsftX2aS9cLIEQMQzECCBicT5mfTaRXRnhYYyYAjlvS/EgfDGCM+u
        //     Knkm9CeKUVbPnHtDYCOqIYtoTwyNmXUMTJOxiYpPhb72lZQw0EoxBAILBsHacb13Xa/sweKuoFko
        //     gFsAGAFgk58TOT1FZHa3sU63V0MArRiCwBzJPkAB4nzmsm1fYeCa2ZvD8G/FOhLgbKDpwGLTBM8y
        //     SYgjpyFfTfZnstLdkhrQ7wVTrzIHKDgDJwAAOQrnuH9nnt2UtMw1JqvBgOfJD4ZOK6a3xzRBw0Cd
        //     oFJy+G+PC1tiPbfszw15mcr7q7hhct9042BAw20ZExzFcxcXtDhT3f3qAlpTeP6CDHPCzXai1cdg
        //     WMT0NBv8PpaM04Pe2VkTrSOU4X2072i4BIlTA0OpjYgnr5fhTtv2ntyNQcfxfECYxykVrcX2dauC
        //     Htpc/rUN94rH4r2S4Vtka0TzR2EeQJI+laW30zGor9ojvD+0FliZZlOYDDeOfdmmOC7YtXi6oxJQ
        //     hWxBzsR55+tcrxvspcRZsXjcKwwW4IOOhBj5j1FT2U4ke9BJMXUC+GsExHn88iptxex8VJVE7lVx
        //     g1YhgJqttdgBv+s0QmMVm5HTHFxWxW40+NVFwiispJ86j8Mw5U+SM3jd2gczuaXa0P5jRrlpl3Ao
        //     a6jgLTT9pkPbqS2BKZ3qOpIohWhGk3Y1Hj2hc2l5iqG2OSzRSs1FUTgihtihG31oUbyqVd1JJqU7
        //     DxsS4ezJArXscGAM89qzrd6GmtAdod2OcfKuyak+jnhS7G/s+mrC741lfaXn4jTdh9W9ZvG0tlrI
        //     r/HRqWDPOr30ESKVtXdO1S/xU8q53F2dKyKtkW4ZoykvgHvVnrxfWi2OMAM86twfwzjkV02F4oOm
        //     G9CNqZ4XhhoV1yTvIqXL63BDCR4U03EgjAiok3VUaxguV3aFTcDBoMkH6Vn3WCwzMFHKdj+pGac4
        //     pVAZydu9GQp6A1xfbHtKt2xbgqLgHu3DAadMZIzBkxt0BqE66Fklx7O+4Lj7bKDqUFpxzwBj0kYp
        //     ZbQuXSbj7DUqg53zt5ivmXD9vXEaUJMRdkxAhYBkxyPzg0yPaB1fW7kkalXOACBIEc8jIPyip2mZ
        //     /wDJXtH0TiySwCicd6OlWt8G7qpDRO/WuT7J9p7huKrtIYooIAjMSD8jEdTgGul7P7RW4Tp1D4oD
        //     YJg7gb9D6jrTT0bRnGfsYFwju8l50a0s94gkdaTvcT8aiBBz4yfzkUTheJYLpkARqGPpV1qw5K+L
        //     HbfDgsM934vWveOC5ETI3pAcVAK7fxTRheDIQ0E/fSaaHcXpMXHDnQGHP5iuAvWX4fi7lkGBqPF2
        //     vPVIj0j1npX0FbhVQoExPy6VxXtpd/8A6LDmBgqW6R8Mx4k09t2QuEUkuzseE4tWRHU/EAwnlNHf
        //     iASDiRXO+zXFrcsFRI0OVzEwwDcvEkVrBs7+VChexSzOLoeF0dBTI4gAZrHa74UL3x6mn4bBf6fq
        //     NDinU5n/AAKVDUsbhquo9a0WKlRlLO27oeFzGwpa7cB5ULWetUJ8aSxJOwf+htUj25FAdqITQnIq
        //     lFGLk2weuvapIqUcEHKQpbaaMppThLXu0tqFgsMhiTkiTkx0JI5dKRuduKjnUx0m2dgNOsGDB89j
        //     J6+Fdbmo9kKLfRurRwxrn+E7ULQyszhTpAwHMkgahnmsAyBmeUHV4bj+84cSql2kEGApIIAgEwRG
        //     YzNT5FIOLQ8LjdajXWPOkew+Me+jOygLqOiDy5Tz5Tt+FaJShJNWDbToEGr0Gii1Vhap0Kzy3cYc
        //     6ftXsZpa3aHOhdp9rW+GSe6zklVWdoXLHw+p26kZ5IqrZpCTT0Ke1fHBLLauJFokBlTSGdiJiAQR
        //     nxjI3rheC4K5xDl/hUjJf4TjLYz1OPnmtRODN26b1/vFtg2QJP4mBgeGNq10K25GuT0EnA2ABE8h
        //     sN/OuSTXpHQsbk/yMyz7Noyg+8bThdQhOeYBmQPSc5xWeex7qiP/AJEnBRSxifiI5DynMdJrbHGM
        //     A2kqBGlDOmQN1knpyAznoBSR49UPu3OgiFEGZECRIHOfvzU2y3ih8M/im93pcQ2oNv4AT5zIjAxy
        //     rY7D9oUtvpuFbYdkuErIVF0xGeWwycb1m3VHEXpjKn+BRDDJ1GfDn5ZrU4fs2wEzaS7cc92CxCLG
        //     XCieZ3AzBIGKcaRj4021E1n7cC3CQhYPcZskLCCdJgmdxtGxPQAs9ndtI3dcMgP8RUlQAOZHUc49
        //     dpxxaa2Fi17ssBsoVSDyJIGwP6iqXrLn95Oi0CFDqQQSDiBM7mMxnrvVKZfi/rNjiO3VUgi0dLfC
        //     znTqEZIEHbxOKLb7ZXUAyqFMd5HLgHO8gH5A1i2wl4qiXJwWct/MdznkSOXgd6XuyFkgMFPuUjCk
        //     yCxEDod5MRS8jstYVX9O14m6tpQzuEU7EkAHy/xXIe2do/aLXeADI6xyEEZyIzI6bCneFvIHKkBy
        //     AqvHXmpIA6AiOvhXL9udrtc4kiSBaC8EsR3dLETy3Bz1PgBVuaaaSIWPi027Og9jOHb3Fw//AGC2
        //     eQwoz9YrdlgdprmuyeKaxbtXW7y3Ljq4T4QpTByckkA/TlnsFsi5BR1ZTMMNjET6yYjfetMc01TM
        //     csWnaEr/ABGobQR91LFjWqeBUZLr8xVDwC8jWilFaMnGT2Zus1PeGtI8GOooZ4MdRRyQcWI66qWp
        //     77KOorxrCUm0PixAtVWtt/KfkafS6i7D1qtzjwOdS270jSMFW5Gb7h/5T8qlNHtAdalK5fCuEP8A
        //     scz2x26jfuU08mDqdRHd26cyCeg8a5pdbhl0yQGnymQOm8fqKAziZG/Xn4VLAEnWzhY0jSPoalty
        //     2xJpKhxLwUAqzASvIDYhhtnecgzjNFftQhLgLO7uNMs3c069RxEmSMmc5mssCTk4+frFXtiSIbbn
        //     Bgef3UugvZ1HZ/bl20iw1sFiNYZdWkAAT1wAMffvVeI7f4h1VxdSdRT3aKQ4iCLhkRBjefMb1hWb
        //     zLKqcE6ogQ3ofyqyyOcecelZuUlqzKTSZqHtziud9gI2AHrsKLa9puIkI14qpOXKKSo5nAJ9PqKx
        //     1VgYmJ28j4EUS8qBEC3GJI79tgQVPUHY+GxHShSf0Wr2PH2i4k6ovvE6VGlZKnxjGI/xT/C9nEkX
        //     +IuO7EhobMDqQQfDoPOlewOzFkXbgkfEikbxuduR2mM1scbx6uwREGkHSxaSvkSPPJjp6DbauzbH
        //     j2mXuOCA5YT3mVSBLTsZGdth03IpDtB9Cyh70e8dtIAUDaOexmeXLrTXaDoLJ2nCk7SecfKaxuD4
        //     W5xBRVZbQdu5qDAskfGBBEYO5E9alps6XJRR5wvvb9xQiQqwwcg6EUDEn8N63E9mMo99y6srd1Yt
        //     hs5IJk5PPH0pm1wYt2ERAraDgcnJEG5AzmScnaOtP9nFR8SGI93qkyGMRJPQGMzvnFNC2+xaxw9q
        //     24tpblW7vdUvIA5kDJwcmfupDjXe0zFMJHMgOqmZxM7T+ppo9or73Qikd4rqZyo1A5ckxgTEmJ8J
        //     zhdq8WQvuNAXBWWGrURguCYzIM9PKKTdCk1GLb0a1m+vEJqd5Cb6iQB0UT5bVThrje6KpdYJJ1RG
        //     ps5EEHwEYG2DOeZFwfCSCR3oYggj5+J2or9p3Gde+VMHSJhOcAb+A3qCF/oSSOlbiiMcOik/CxM4
        //     6ZIA+cUp2xd4mF1EKO4oZIKLO5JOJz6CPEnKTtbiEUotxgD8eQGMHmc7ZJ6coo3F8czWUUadImBH
        //     eE5hQMZnxIE75gcto080K0M9scfbto4VIczox3mcnL7eM+PqKxuEI927XiC76WA3YkGST54+tDu2
        //     DcfU0MzFmDbHfAjw5AA45dH+D9mbzHVcBRMMztAOeQHXzgDcztWiqqMnlUnaX/hX9oN7lUaNOoXs
        //     GGkDHhtjlTnAe1Js3WcKSrSoQkATybzwPrW9wXs3whUFgW0nTL3BDQDneMScRtJmsHtX2dW2uoBl
        //     B7p1MCA0wAZAEHrMzjpSSS2LjOtsfs+1FtmguwE241yWkMZEjzGeldNwl4uAROV95nrOfw+vKvlN
        //     zhtBhwQREz3SPAg09wvaz21IklSptkBjpI8gY6DGIrVT4+rMW702fQ27QSY96k/1DkJPPpRDJEhs
        //     HmNjXz+12lDy4OnLCIJB3kRjwkcp2xG92HdJuShIRhq0ydJJiCAR4/5xnSGW3TRbxpxuMjceeZNL
        //     3D4mj32AmTsQpHPJgfWR5z0pNrykBgwg90f6QfxFdGjDYO4T1pe41WTiUuEhDMc+UeH3VS4pqkk9
        //     oV0LlqlQqalOg5HDIrGAJJ+dFKnAaCFn67yRv8/Kq6cZbbvASYHl9KuoEERJPUCK4GzqtEUKY257
        //     belHVQdhJwuAfTAqwtpglZcRpEDSY31SZ8IijWbjrMFFHxQgA+g/XzqG/jM5OvZRbDTAQzzkR9Pz
        //     qsnIyD8PMHyj6RRyZ/jnGqDuOpMeP65VQr649P0Kyv6c7ewIP+M/lR7SjmDHMZAxsB+fKvGuknpP
        //     h44olpw0hmIABzqVcDkFMSZ5AyfrTHF0wy9q3mGkNoxhQO6BEQAdoAER4eFAt8S4wCTj3aj/AAM5
        //     MGiE2v4Q7DlkKT5xI/W9FADkwERjzJMEk7TkDJmSQOu1JyN3kaaV7FLyXGtkPLDLKpYbxkkb8uce
        //     G9EbirpYu1xmdk9xq2VRAGPlGPOrsQF7pPe0zMfFGYPnOekUuAWwOUsYkwOpx5ZpqTYnkrt7NPs/
        //     t0IVVwSgJmAJIjafMHEdeeaLd7aW5KubiqSfh+Flj4SCZBmBI5T5VmLwb6A+k6STDRyEyJOOtCv2
        //     52iDGwwCQMZxuKFJdIpZaNXiO1EVwUJAYHVbUdxN9iepJP8AnNZHal33r6lGhVAhecdZ9YivDabb
        //     zjr5177poAwI72AImOlNSSHLLapgGtANBgkHMHJnnmrGwoInYDIYx6irvwwJnaIggDrO/wBK8fhS
        //     D3jjlOYx19Nqd/0yb/p5buAERECcEhiDt4c87/KZJwdTKWbu/CBkZPME9TM/jmlG4YydJGYblj9Y
        //     pixaYkaiDg2xE9OflFDrtMpV9Oj7O4UIquyDU494u+oLnaPAyYzuOtP2u1ktuO4XQSxUkx7wLgkn
        //     qc7E52g1y3C37gurLPDAqec4MRIjoa9TtF35gaf4TMbHIH+enOaaa6NIyXSO3Ha6A/vsP3ZNsh0i
        //     MwJjn/7jLK8SPdszAsjgr7sgfCGO0EZgA5JG4navn13jkIBIYMJnHenaQfntjPhWhw3HgqFDNhtS
        //     hgWAHWY8dpo/hunb7NTtns+3e0pbtujop7zgaWIEFDBJwR6Z9ORv2ntko1uHypWCCI3kGu04d1uA
        //     zcAMrc3IZJiSRExJnny60r9hTiWPvtZKSusQG06jGTIjPP6ZoVWE8aaujjS+YIII2I3HlTPB8U6G
        //     FuMFPTB2IE+hP6FP8V2ALRE3UYsCygP7tt8Ehh1EEAyDjxrOu2lSIbUcMdOYAP8Anl51TTRyNOPR
        //     0/C+0OtGW7lw632JAGoCMASM5JPrXP3uKZdao50DWw8Z/CBABz8qWN0Hn1/QqnvImNxLH5iADQpN
        //     9lLo0+zuIa2HcoQWGnJ0BRJkR8zzx8j0h41NOsuoTFtZgs7RmACRifv5RXCXL7upDMSAMDoauOPH
        //     u9GP5RzgdB981tDI49CcVI6i52rb1GLbt4iIPlmpXL/a1GAXIG2KlV5ZFeOIqrAf+quGIiAT9KPw
        //     a24IcLOYJJBjSY8N4zFPXeH4RQGW+5MiV0zIjOceP5VgyGZ3ewYH058jRFBE5zBUYDb8/ruBVra2
        //     ywGtgpTUcEn3n8v4/jRLVxFWbgBb+FZIIIIwenmR9RUtMVfAYIAxv1iKtqkyfWIiOVGvlCGZIgEx
        //     hpIkQATjaSZ/Ij33/DksMiQNMAzMtiY6aTtv61PGyHFgxuDpEZyZ5D/NEJ3iBEffmfmeVeW3tso1
        //     OQdis89UEDB6yIJnnEUO9o92SrNONMxvIxETtOZilxYcXXoKl9dOlmfSGLRIAnTBaYPIjHP5Ra3c
        //     UHSpw3eV4EbZBnrMcs+Iqq27BAMsQH7wJOnRJxsCMAHc1T9wfhZogrMHvmRyzEiTj6UcUxtWM+4M
        //     AFh3tyVOoZwRufDyqvD8Y1mYdlmVOnukqRBUjmCOtQFGTd47xXOZnA2GInw8tqVvX7WggFmYEsCS
        //     d4WF2/q6fdQoX2zOMJSbt2GcrIKkkSZ6ATt6jfFUc7xsOe3rRrd3h2JIVogsZJw0yI+ZH/jPPLDG
        //     woguQCW898DaNs+cbVLi06CUXF92JGYGd/HJ2x8oq3vuUDlMGD6ekVe57gLCOxPxCRz6bDzo6rw7
        //     KuYaVmCY5STOOZG9JpLsaS9g016NQA0A6SfHkAd/UUYBHAZGJdVa6+qFUHkiHJmTGfCOlDexYEaW
        //     aIDYJic9V5YHLn5UB7X7whDIywiZgHnPlt5Uml2WqPTdYMXmCB7wwI5dB1z0pjheyOJuprt2mZIa
        //     8GDLGnYnJ6xPMUu9p5I0/D3iOkjGPn6UIIAe7gsckYO9NNUO7GeHUBl6/CZYHccvrS1whWYQSRLc
        //     9R6Tv1pizcGJ/hH1mOVCZlV2dT3j3hMT41MXt2EF9BlCJnvDCkggiAv+DnbeKHb4tx3laCD7wdD5
        //     +vLnWvw7qtsoXySLkLcEqJwATg5yc9KxOOSLjwTBJ856keOdq0hK21R1PG4q0zqOF4xLtpVVtLsq
        //     22BG8ATJmdwcAdOVX4a7fW2ytACnS4gwG1ZkHxBBI/E1j+z3FqraC4WQF1naZ+GYmNj50fheKBa8
        //     JJKszKTOYmMExkidq0ao0i7H+3rLfZ+8q6l1XASTJAOcAz1id8enHxiBkkjHXqPursRxOsolxSyu
        //     PdkzkSuwEyDJJnYehrm+0OBazf8Ac7qW1I2AxUEwdUEiOY+m1OL12Z5I27QS1wcAg91mz3vuESNu
        //     sR4UH3BSCVJBPoYOR1yDVSuYLOxUZOg6YA23n7qKeNm2ylCdtODA8/pWe09bM1EpfYPdOhNKsFUj
        //     JAMCcmTvJzQeI4GBKtO84IiOvnvU4fiRmfizDZPoPPxot3iULnusqEju6gWGMwT13zV7T0JiPuh+
        //     sVKtcZAxjVEmNSjVHKc1K02Gw1i9KFNJJJJwQJ8/Ka0+FvWWULBcwlrSx0jujlvuQJ2rMu8YhUhb
        //     SqSNMnMY+/xpEPRTYNfGbI4kKcWwGQnkAR+8kRIO2RH5UN7i/EUju6BscyTq23GBJz61n+/PMnxz
        //     VhxMbTECZ6+FJpktP0aY49P+kuDkY/m5Y6SOvPeiXuBNtUHcLHS5Cd5ufdJ64BgSM7yDGO14Ezn8
        //     /OmLvaLNpEmFAUTyEbD9detS4v0S4uy3u1UsWGOQJMT/AOqMzAA5/wC7AEzyjy6fnWdd4gselMcB
        //     xdtH1XENwfy4gnqaHBvsfBurGSttgBEkhZ0kb+A/CtVfZm/o1LoWAG0kkt58vuNIcd2rw7sr27Lo
        //     ynMMFVh4wJ+tN2va0rEITG0nlHP75pcWbQxwWpOzM43h79lSt1SqkmDgg+RHXpSaxBIJJPdOYrcv
        //     e1TMGBTUDCgMAVAgzj5c9qFxnb1t7K20sBIhpAGW6nf5VSuuhSiov8TLCOqa8Rq90eZmNj55oRus
        //     ee36gUS5xQKlQpWWDxOJg5o37SHuFte7SVL96DJkzq33G0xkBRyy0r7RKV9oUTiGBxHyow4xojGP
        //     r50qW8K2u3O3/tKldLAFxxA1Mpgw0qIUE5aASTgCm4p+gcU/RnvxZIgBfQGan2p1JBwwlTIgg9DU
        //     7J4wWb6XCCQp1GN9uXzo3b3aK8RfNxQQCFUat8DzP30uC+BxXwr+0Hg4BnfBq1vjGdgGCHzUdN5o
        //     XZvGi1cDlFeCGzIIgzKkRB8c+VCfiQ1wuUUBmZ9CiEWTOkDkBsBRwSWgqlocDRr2Grpt4jp4UJ3Y
        //     IFn/ALjgDn18JoX2ldtJio3F748qlRfwVMPYuskyoIJKwwDcv1t86Y+yvcAJbuDvEhgSMZMem1IH
        //     iAdwYEdAaatdpIgGlCD5z+VRNSW4rZom2qfQ1a4RrDrdBIjvLkTt6/WhC45ZgCTgqcZAJzImOZ/K
        //     gN2mCrAqTJxP8I8KB9rGBBIEGCRk+OKFGbX5CSrVmt+0jbcEkMPhIAkaZxHptNU46494gqukBRaG
        //     RMSfM56zmsy9xKsAACI+vrRPt6yO53RuOp6mnxaSpFeuPopw9shiJIE6WIHKdgf1NFuKyBQxn4ti
        //     dSmd/wDFLNxAyFECdQ2nyNXbjJYFgWGO6dqqnYJpIDcUqZmSSY/OotwjMT4mavxF8MAADid6NxPG
        //     goLVoMlvu3HUmS12ILE+EkAch4kk6JWtkntm0CoJ15nZsb1KXS/Aj8BUqal9HURepUqVYiVKlSgC
        //     VKlSgCVKlSgCVKlSgCVKlSgCVKlSgCVKlSgCVKlSgCVKlSgCVKlSgCVKlSgCVKlSgCVKlSgCVKlS
        //     gCVKlSgCVKlSgD//2Q==`

        //       let formattedImage = 'data:image/jpeg;base64,' + '\n' + base64Data;
        //       version.content = this.sanitizer.bypassSecurityTrustResourceUrl(formattedImage);


        //       let id = version.id
        //       let content = version.content
        //       let deliveryDate = version.deliveryDate.toLocaleDateString(undefined, options)

        //       source.push({ position, id, content, deliveryDate })

        //       position++
        //     })

        //     this.historyHomeworkDataSource.data = [...source]
        //   })
