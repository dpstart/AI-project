# AI-project

## SERVER: DB

### How to run DB:

```console
docker run --name teams -p 3306:3306 -v <Database volume on the local filesystem>:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=admin -d mariadb:latest
```

### Flyway

- It's a database migration tool

```xml
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
```

#### Why did we use it?

Default schema doesn't work because of SQL dialect problem

```java
 auth.jdbcAuthentication()
      .dataSource(dataSource)
      .withDefaultSchema()
      .withUser(User.withUsername("ADMIN")
        .password(passwordEncoder().encode("admin"))
        .roles("ADMIN"));
```

So, it was necessary to manually create USERS and AUTHORITIES tables and override the custom query:

```java
usersByUsernameQuery(
                        "select username,password, enabled from users where username=?")
               .authoritiesByUsernameQuery(
                       "select username, authority from authorities where username=?")
                .passwordEncoder(passwordEncoder());
                .withUser(User.withUsername("admin") //to comment after the admin has been inserted
                        .password(passwordEncoder().encode("admin"))
                        .roles("ADMIN"));

```

However in this way, two issue come out:

1. we want to keep the benefits of automatic table generation: spring.jpa.generate-ddl=true 
2. we would like to add ADMIN only at the first run automatically;

Solutions:

- db.migration 
    - V2__create_auth_tables.sql
    - V3__contraints.sql 
- flyway schema history table
- spring.flyway.baseline-on-migrate = true

The DB reaches 3 version during the application first run:

0. init;
1. creation of the base tables;
2. creation of USER and AUTHORITIES tables;
3. creation of the ix_auth_username contraint between the two tables;

The ADMIN is added only after this creation.

### Current state:

| Username |     Password   | Role | Name | First Name | Email | Alias |
|----------|:-------------:|------:|-----:|-----------:|------:|------:|
| admin|  admin | ADMIN |
| 100000 |   a.servetti   |  PROFESSOR  | Antonio | Servetti | d100000@polito.it| antonio.servetti |
| 100001 | g.malnati |  PROFESSOR  |  Giovanni | Malnati | d100001@polito.it| giovanni.malnati|
| 100002 | g.cabodi |  PROFESSOR  |  Gianpiero | Cabodi | d100002@polito.it| gianpiero.cabodi |
| 257649| g.pastore | STUDENT | Giuseppe | Pastore | s257649@studenti.polito.it| giuseppe.pastore|
| 200000 | d.fisicaro | STUDENT | Damiano | Fisicaro | s200000@studenti.polito.it| damiano.fisicaro|
| 200001 | w.forcignano | STUDENT | Walter | Forcignano | s200001@studenti.polito.it| walter.forcignano|
| 200002 | d.paliotta | STUDENT | Daniele | Paliotta | s200002@studenti.polito.it|daniele.paliotta|
| 222220 | a.rossisi | STUDENT | Antonio | Rossi | s222220@studenti.polito.it | antonio.rossi |
| 222221 | r.rossisi | STUDENT | Rocco | Rossi | s222221@studenti.polito.it | rocco.rossi|
| 222222 | m.bianchi | STUDENT | Mario | Bianchi | s222222@studenti.polito.it | mario.bianchi |
| 222223 | c.verdidi | STUDENT | Chiara | Verdi | s222223@studenti.polito.it | chiara.verdi |
| 222224 | s.ventura | STUDENT | Simona | Ventura | s222224@studenti.polito.it|simona.ventura|
| 222225 | f.totti10 | STUDENT | Francesco | Totti | s222225@studenti.polito.it | francesco.totti|
| 222226 | v.valentini | STUDENT | Valentina | Valentini| s222226@studenti.polito.it | valentina.valentini|
| 222227 | g.buffon | STUDENT | Gialuigi | Buffon | s222227@studenti.polito.it | gianluigi.buffon |

| Course |     Acronime  | Min | Max | Professors (C = Creator)| Students| VM Model          |                                                                                                                                                                                                      
|--------|:-------------:|----:|----:|------------------------:|--------:| ------------------:|
| Applicazioni Internet | AI | 1 | 4 | Servetti (C), Malnati | 200000,200001,200002,257649| MacOS High Sierra |
| Programmazione di Sistema| PDS | 1 | 5 | Malnati(C), Cabodi | 222220 - 222227 | Windows 10 |

| VM Model| 
|:-------:|
| Ubuntu 18.04.2 LTS|
| Windows 10 |
| MacOS High Sierra |

| Team          | Course | ID | Members (P=proposer)                | #cpu | disk space | ram | max active | max_available |
|--------------:|-------:|---:|---------------------------:|-----:|-----------:|----:|-----------:|--------------:|
| SecondoTeam | AI | 9 | 200000,200002,257649 (P) |8|512|4|1|4|
| IlCapitano | PDS | 17 | 222225 (P) |2|128|4|1|1|
| SecondoTeam | PDS | 12 | 222227 (P),222220,222221 |4|256|8|2|3|

| VM Id  |  #cpu | disk space | ram | team  |
|-------:|------:|-----------:|----:|------:|


## SERVER: Web Security Config

- Based on JWT Token
- Token provider and application service kept separated
- All the API of the application service (starting with API/...) are secured except for registration or login endpoints:
    - API/students (POST)
    - API/professors (POST)
    - API/login (POST)
- The endpoint of the authentication service are not authenticated as they have to be accessible from the application service in case of registration,login,... but they are protected through the encryption of the token containing the information passed.
- Also the notification endpoints are not authenticated

## SERVER: Authentication service (JwtAuthenticationController.java)

- The authentication service has three roles:
    - token provider
    - creation/removal/update(activation)/authentication of users
    - user's authrities management
- In this system, it has been chosen to keep it completely separated from the application service

- It provides 5 endpoints:
    - *\authenticate*: 
        - received data from application's endpoint \API\login
        - accessible also from outside (only trough the id)
        - return the jwt authentication token as string
        - errors:
            - Unauthorized: wrong credentials/not-existing user/disabled user;
    - *\register*:
        - receives a signed data from application's endpoint \API\register
        - in this way, it is guaranteed that registration can take place only for student/professor registering through the application form;
        - the token contains:
            - usernam
            - pwd
            - roles
        - errors:
            false: whatever failure (already existing user,...)
    - *\registerMany*:
        - the same as the previous one with multiple registration token received;
        - errors:
            flase: whatever failure also for only a single user;
    - *\activate*:
        - activate the user after the registration
        - receive a signed token containing the username to be activated
        - only through the application, to favor the consistency among students/professors and users
        - errors:
            false:  whatever failure 
    - *\removeMany*: 
        - delete the users indicated
        - receive a list of signed token, each of which containing the username of user to be deleted
        - only through the application for consistency reasons
        
## SERVER: User Registration (StudentController & ProfessorController)

- ADMIN registered a priori: username: ADMIN, password: admin
- Endpoints: API/students & API/professors (POST)

0. Data are received from the client form
1. Email and alias are autogenerated and not received from client;
2. In case of profile image, it is saved on the DB;
3. Student/Professor entity is stored in the DB with status=disabled;
4. registration token is built with user data (id,pwd,roles);
5. HTTP request is sent towards "/register"-"/registerMany" of the authentication service
6. If success, the user is notified via mail with a link of confirmation account:
    1. a token is randomly generated;
    2. a ConfirmationAccount entity is temporarly stored with (token,userID, expiration date) information;
    2. the user has 1h of time to activate the account through the link; an asyncronous periodical task is entrusted to remove not activate user for which the token is expired contacting \removeMany endpoint trough signed removal token;
    3. the link has the form: localhost:4200/notification/activate/
    3. by clicking on the link, (while on the client it is always shown a general message for security reasons), on the server:
        - if the token is expired, the user removed both form the application and authentication DBs;
        - if the token is valid, the user is enabled on both the datasets and the token is deleted;
        
## SERVER: Login (LoginController)

- The LoginController exposes one single endpoint for the login of a user;
- The login doesn't set any session, but provides the authentication user the authentication token;
- It is possible to obtain the token also from the public API /authenticate on the authentication service but only with the id;
- From the login form of the application instead it is possible to perform the login using one of the following information as username:
    - ID;
    - email;
    - alias;
    - alias - mail (<alias>@studenti.polito.it or <alias>@polito.it)
    
0. Data are received from the client form
1. If the username is different from the user ID (mail,alias, alias-mail), the student/professor table is accessed to retrieve it;
2. HTTP request is sent towards "/authenticate" of the authentication service
3a. If success, the jwttoken is returned;
3b. If failure, Unauthorized or general Internal Server Error;

## SERVER : Course Creation ( /API/courses (POST))

TODO

## SERVER : Course Managament (settings, share, remove, update)

TODO

### Update:

- It is not possible to set a minimum or maximum size for the teams of a course, such that some already existing teams are invalidated;
- ...

## SERVER : Course student enrollment (enroll, enrollMany, enrollManyCSV, unsubscribe)
    

## SERVER : Team proposal

- A student can send a team proposal for a course to other students enrolled in the same course;
- The team proposed must be part of the proposed team and his token is always considered as accepted;
- A user can't be part of more than one team for a course;
- A user can create as many proposal as he wants but only the first accepted by all the invited members will create the team; (all the other proposal will be evicted)
- The name of a team must be unique for a course;
- The number of members invited must respect the course's constraint set by the professor that created the team;
- A disabled team is created with token associated to each invited user
- A user can accept/reject the invitation
- If all the invitation for the team are accepted, all the other proposal including the members of just created team are evicted;
- If also only one invitation for a team is rejected or expires, the team is evicted;
- A team is evicted by setting his course to null;

0. Input are received from the client form (Name of the team, members list, expiration time)
1. If the team proposal (name, memebrs list, # members,...) respect the setted constraints, a disabled team is created along with as many token as the number of invited students;
2. Each token is associated with a team and a user; a periodical asynchronous task check if expired tokens exist to evict the associated team proposal;
3. Each invited student receive an email with two links: one to accept the invitation, the other one to reject it;
4. Once the user click on one of the two link, he sees a summary page on the action he just performed;
4b. A user can accept/reject the invitation also from its personal page (on the specific course tab);
5. Once a team is created, its member will be not able to see the team proposal page anymore but they only see a summary page on the team composition;

## SERVER : Team information

- API/courses/{course}/teams: return all the temas created for this course to a professor owning the course;
- API/courses/{course}/teams/{teamID}: return the information about a team to a professor owning the course or to a student enrolled in the team; not used by the client;
- API/courses/{course}/teams/{id}/adhesion: return the status of the invitation for each student in the team; for the requesting use it returns the token to accept;
0. A user belonging to a team for a specified course can ask for the adhesion info by clicking on the team information tab on its "groups" page;
1. All the tokens associated to a team are collected;
2. For each user it is checked if an associated token exists:
    2a. If the token exits it means the user has not yet accepted/rejected the invitation:
        - if the user is not the authenticated one, "false" is returned;
        - if the user is the principal, the token is returned;
    2b. if the token does not exists, it means the user has already accepted the invitation;
    
- API/courses/{course}/teams/{id}/members: return the members of the team;
- API/courses/{course}/teams/{id}/inTeams: students not yet enrolled in a team;
- API/courses/{course}/teams/{id}/available:  students already in a team;

## SERVER : Team VM settings

- The professor can grant to each team of his courses the usage of certain quantity of VM resources;
- API/courses/{name}/teams/{id}/settings (POST)
    - {
          "n_cpu":"10",
          "disk_space":"256",
          "ram":"8",
          "max_active":"5",
          "max_available":"10"            
      }
- He can change it whenever he wants, without invalidate the already existing VMs;

## SERVER : VM management

### VM Model (VMModelController)

*Creation/Removal:*
- Only the ADMIN can create/remove the VMModel through the endpoints /API/models/ (POST) & /API/models/{name}/remove;
- A VMModel is identified by the name of the operating system of the machine (e.g. Windows 10, macOS High Sierra,...);

*Definition of a VM Model for a course:*
- API/courses/{course}/model (POST)
- A professor can define a vmm model for a course, that is valid for all the teams belonging to this course;
- It is impossible to change the Vm model for a course for which VMs have been already instantiated;

### VM instances (CourseController + VMController)

*Creation (API/courses/{courseName}/teams/{teamId}/createVM):*
- only the student that is member of a team can create a VM instances, after that a VM model has been defined for the course and the professor grant some resources to the team;









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
                
    Removal: API/courses/{course} (DELETE)

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

    Enable: API/courses/{course}/enable (POST)
    Disable: API/courses/{course}/disable (POST)
    
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

#### Proposal

        propose a team: API/courses/{name}/proposeTeam (POST)
                        {
                          "team":"FirstTeam",
                          "members":["2000","2001","2002","2003"],
                          "timeout": 600000   <--- expiration time to accept the invitation
                        }

        accept:
        
        reject:
        
#### Team info

A student enrolled in a course or the professor can see the information on team for that course. Only students in a team can see adhesion information of the other members.

        adhesion info:  API/courses/{course}/teams/{id}/adhesion      (GET)
             
        one team:       API/courses/{name}/teams/{id}/                (GET)
             
        teams for      
        a course:       API/courses/{name}/teams                      (GET)
             
        members:        API/courses/{name}/teams/{id}/members         (GET)
        
      
#### Student availability

Through these methods it's possible to check which students are available or already busy in a team for a course

        busy:           API/courses/{name}/inTeams                    (GET)
        free:           API/courses/{name}/available                  (GET)
        
       
                    

### VMModel

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
    


#### Definition of a VM Model for a course

A professor owning the course can define the VMM model for that course and the VM settings for each team of the course:

    define VMModel:             API/courses/{name}                       (POST)
                                {
                                   "model":"macOS High Sierra"
                                }
                    
    set team settings:          API/courses/{name}/teams/{id}/settings   (POST)
                                {
                                    "n_cpu":"10",
                                    "disk_space":"256",
                                    "ram":"8",
                                    "max_active":"5",
                                    "max_available":"10"
                  
                                }
                    

### VM instances

#### Creation

A student can create a VM instances for a team for which it is a member, only if the requested resources are available among the reserved ones.

     creation:                      API/courses/{course}/teams/{teamId}/createVM  (POST)
                                    "settings"={
                                         "n_cpu":"2",
                                         "disk_space":"20",
                                         "ram":"2",
                                     }
                                     "image" = .jpg


