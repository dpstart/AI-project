# AI-project

## Server

### How to run DB:

```console
docker run --name teams -p 3306:3306 -v <Dtabase volume on the local filesystem>:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=admin -d mariadb:latest
```

### Database information:

| Username |     Password   | Role | Name | First Name | Email |
|----------|:-------------:|------:|-----:|-----------:|------:|
| admin|  admin | ADMIN |
| 1000 |   a.servetti   |  PROFESSOR  | Antonio | Servetti | antonio.servetti@polito.it|
| 1001 | g.malnati |  PROFESSOR  |  Giovanni | Malnati | giovanni.malnati@polito.it|
| 2000 | g.pastore | STUDENT | Giuseppe | Pastore | giuseppe.pastore@studenti.polito.it|
| 2001 | d.fisicaro | STUDENT | Damiano | Fisicaro | damiano.fisicaro@studenti.polito.it|
| 2002 | w.forcignano | STUDENT | Walter | Forcignano | walter.forcignano@studenti.polito.it|
| 2003 | d.paliotta | STUDENT | Daniele | Paliotta | daniele.paliotta@studenti.polito.it|

| Course |     Acronime  | Min | Max | Professors (C = Creator)| Studenti|
|--------|:-------------:|----:|----:|------------------------:|--------:|
| Applicazioni Internet | AI | 1 | 10 | Servetti (C), Malnati | 2000,2001,2002,2003|
| Programmazione di Sistema | PDS | 1 | 10 | Servetti (C) | 2000,2001|

| VM Model          |
|------------------:|
| macOS High Sierra |
| Windows 10 |

| Team          | Course | ID | Members             |
|--------------:|-------:|---:|--------------------:|
| FirstTeam     | AI     | 9  | 2000,2001,2002,2003 |
| SecondTeam    | PDS    | 10 | 2000,2001           |




## Endpoints

All endpoint are authenticated expect for:

<ul>
<li>API/students (POST): for the registration of a student</li>
<li>API/professors (POST): for the registration of a professor</li>
<li>/authenticate (POST): for the authorization token retreival </li>
<li>/notification : for the confirmation/reject of the account creation and team proposal; the authentiction here is given by the uniue token generated by the server </li>
<li>/resources : to make the browser access to the public server resources </li>
</ul>


### Professors



#### Registration

    API/professors (POST)
    
    "professor" = {
                       "id":"1000",
                       "name":"Antonio",
                       "firstName":"Servetti",
                       "email":"antonio.servetti@polito.it",
                       "password":"servetti"
                   }
    "image" = file jpeg


### Students 

#### Registration

    API/students (POST)
    
     "student" = {
           "id":"1000",
           "name":"Antonio",
           "firstName":"Servetti",
           "email":"antonio.servetti@studenti.polito.it",
           "password":"servetti"
       }
    
    "image" = file jpeg



### Courses

#### Creation/removal

Only a professor can create a course; only the professor created a course can remove it.
A course can be removed only if it has been disabled first.
The removal of the course cause the removal of assignments, homeworks and teams associated to it.

    Creation:   API/courses/ (POST)   
    
                {
                    "name":"Applicazioni Internet",
                    "acronime":"AI",
                    "max":10
                    "min": optional
                }
                
    Removal: API/courses/{course}/remove (GET)

#### Update 

Only a professor owning a course can update it.
It is impossible to set minimum/maximum values such that to invalidate teams already present within the course.
    
       Update:  API/courses/update (POST)
       
                {
                    "name":"Applicazioni Internet",
                    "acronime":"AI",
                    "max":10
                    "min": optional
                }
            

#### Enable/disable 

Only the professor having the ownership of a course, can enable/disable that course.
Disabling a course means also disabling all the VM instances associated to it.

    Enable: API/courses/{course}/enable (GET)
    Disable: API/courses/{course}/disable (GET)
    
#### Access to course

    All:   API/courses/ (GET)
    One:   API/courses/{course} (GET)

#### Share ownership

Only a professor already having the ownership for a course, can share it with another professor not already having the ownership for the same course.
 
    API/courses/{course}/share (POST)
    {
        "id":{professor}     
    }

#### Enroll/Unsubscribe
Only a professor owning the course can enroll/unsubscribe students present in the DB for an **enabled** course.
The removal of a student from a course cause the eventually removal of him from a team; if after the remotion, the team members' size goes under the min threshold for the course, the team is removed too.
  
    Enroll One: API/courses/{course}/enrollOne (POST)
                
                {
                    "id: {student id}
                }
                
    Enroll Many: API/courses/{name}/enrollMany (POST)
               
               {
                    "students": ["2000","2001"]  <--- array of student id
               }
               
    Enroll CSV: API/courses/{name}/enrollManyCSV (POST)
                
                "file": student.csv
                
    Unsubscribe one:  API/courses/{name}/unsubscribeOne (POST)
    
                     {
                         "id: {student id}
                     }
    
    Usubscribe many: API/courses/{name}/unsubscribeMany (POST)
                        
                        {
                            "students": ["2000","2001"]  <--- array of student id
                        }
                
Any authenticated user can access to the enrolled students information:

    getEnrolled:    API/courses/{name}/enrolled (GET)
    
    
### Teams

A student enrolled in a course can propose a team for that course. The proposed team is created only after all the team members accepted the invitation.

        propose a team: API/courses/{name}/proposeTeam (POST)
                        {
                          "team":"FirstTeam",
                          "members":["2000","2001","2002","2003"],
                          "timeout": 600000   <--- expiration time to accept the invitation
                        }

#### Proposal



    

### VMmodel

#### Creation/removal

Only the ADMIN can create/remove a VMModel;

    Creation: API/models (POST)
    
               {
                   "name":"macOS High Sierra"
                   	
               }

    Removal:  API/models/{name del modello}/remove (GET)
    
#### Access

Any authenticated user can access information about VM models available in the database:

    All:          API/models (GET)
    One specific: API/models/{name} (GET)




