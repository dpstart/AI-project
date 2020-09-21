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
| Applicazioni Internet | AI | 1 | 4 | Servetti (C), Malnati | 200000, 200001, 200002, 257649| MacOS High Sierra |
| Programmazione di Sistema| PDS | 1 | 5 | Malnati (C), Cabodi | 222220 - 222227 | Windows 10 |

| VM Model| 
|:-------:|
| Ubuntu 18.04.2 LTS|
| Windows 10 |
| MacOS High Sierra |

| Team          | Course | ID | Members (P=proposer)                | #cpu | disk space | ram | max active | max_available |
|--------------:|-------:|---:|---------------------------:|-----:|-----------:|----:|-----------:|--------------:|
| SecondoTeam | AI | 9 | 200000, 200002, 257649 (P) |8|512|4|1|4|
| IlCapitano | PDS | 17 | 222225 (P) |5|128|4|1|1|
| SecondoTeam | PDS | 12 | 222227 (P), 222220, 222221 |4|256|8|2|3|

| VM Id  |  #cpu | disk space | ram | team  |
|-------:|------:|-----------:|----:|------:|
| 33 | 1 | 50 | 1 | 9 |



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

## SERVER : Course Creation

- To add a new course an authentication as professor is required;
- Sending a CourseDTO inside the body of a POST to "/API/courses" will create the course if the name and the acronime aren't already used by other courses;
- The response will contain the updated DTO (retrieves the Course entity from the database and maps it back to a CourseDTO, used to avoid potential changes in saveing the new entity in the db)
- CourseDTO structure: 
        {
                "name":"Applicazioni Internet",
                "acronime":"AI",
                "max": optional (int)
                "min": 1 ore above
                "enabled": optional (boolean)
        }

## SERVER : Course Managament (remove, update, share, enable/disable)

### Remove:

- To delete a course the user needs to be authenticated as a professor teaching in it;
- Sending an empty DELETE to "/API/courses/{name}" will delete the course, if it exists;
- The course can't be deleted if it is enabled (meaning VMs can be used in that moment);
- Deleting the course implies deleting all of its VM images;
- Teams, Assignments and Homeworks are mainteined to allow data recovery.

### Update:

- To modify a course the user needs to be authenticated as a professor teaching in it;
- Sending a CourseDTO inside the body of a POST to "/API/courses/update" will modify the course settings of the given course, if it exists;
- It is not possible to set a minimum or maximum size for the teams of a course, such that any already existing team would be invalidated.

### Share:

- To share a course the user needs to be authenticated as a professor teaching in it;
- Sending a professorId inside the body of a POST to "/API/courses/{name}/share" will share the course with the given professor, if it exists;
- Expected input:
        {
                "id": id of the professor (string)
        }

### Enable/Disable:

- To enable/disable a course the user needs to be authenticated as a professor teaching in it;
- Sending an empty POST to "/API/courses/{name}/enable" will enable the course, if it exists;
- Sending an empty POST to "/API/courses/{name}/disable" will disable the course, if it exists;
- Disabling a course stops all of its VMs


## SERVER : Course student enrollment

### EnrollOne

- To enroll a student in a course the user needs to be authenticated as a professor teaching in it;
- Sending a studentId inside the body of a POST to "/API/courses/{name}/enrollOne" will enroll the given student in the course, if it exists;
- Enrolling a new student to the course will create for him an empty homework for each assignment that has at least 10 minutes remaining before expiration;
- Expected input:
        {
                "id": id of the student (string)
        }

### EnrollMany

- To enroll more students in a course the user needs to be authenticated as a professor teaching in it;
- Sending a list of studentIds inside the body of a POST to "/API/courses/{name}/enrollMany" will enroll the given students in the course, if they exist;
- Enrolling the new students to the course will create for them an empty homework for each assignment that has at least 10 minutes remaining before expiration;
- Expected input:
        {
                "students": id of the students (List<string>)
        }

### EnrollStudentsCSV

- To enroll more students in a course using a CSV the user needs to be authenticated as a professor teaching in it;
- Sending a list of studentIds inside a csv file in a POST to "/API/courses/{name}/enrollManyCSV" will enroll the given students in the course, if they exist;
- Enrolling the new students to the course will create for them an empty homework for each assignment that has at least 10 minutes remaining before expiration;
- Expected input: CSV file containing all the ids in the first columns, one for each row;

### Unsubscribe

- To unsubscribe one or more students in a course the user needs to be authenticated as a professor teaching in it;
- Sending a list of studentIds inside the body of a POST to "/API/courses/{name}/unsubscribe" will unsubscribe the given students from the course, if they exist and are enrolled in it;
- Unsubscribing the new students from the course will delete their roles in regards to their teams vms, remove them from their teams, deleting the teams if they fall under the course minimum team size;
- Expected input:
        {
                "students": id of the students to remove (List<string>)
        }
    

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
- API/courses/{course}/teams/{id}/inTeams: students already in a team;
- API/courses/{course}/teams/{id}/available: students not yet enrolled in a team;

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
- only the student that is member of a team can create a VM instance, after that a VM model has been defined for the course and the professor grant some resources to the team;

*Execution (API/vms/{id}/run):*
- Only a student owning it can run the VM
- If the current number of active VMs is under the defined threshold
- The course must be enabled to run the VM

*Connect( API/vms/{id}/connect):*
- Only the students part of the teams associated to the VM or the professor of the course associated to the team can connect to the VM;
- Only if the VM is running;
- Connecting means obtaining the VM's image;

*Stop( API/vms/{id}/stop):*
- Only a VM's owner can stop it;

*Update( API/vms/{id}/update):*
- Only a VM's owner can update it;
- With or withou the image;

*Remove( API/vms/{id}/remove):*
- Only a VM's owner can remove it;

*Share Ownership( API/vms/{id}/share):*
- All the owners can share this role with the other team members;


## SERVER : Assignments

### Add

- To add a new assignment to a course the user needs to be authenticated as a professor teaching in it;
- Sending an AssignmentDTO and an image file inside the body of a POST to "/API/courses/{name}/assignments" will create the assignment;
- The response will contain the updated DTO (assignment id is generated automatically by the server);
- Professors can't create a new assignment giving less than 23 hours and 59 minutes to the students to deliver it;
- An empty homework entity is created for each student enrolled in the course;
- AssignmentDTO structure: 
        {
                id: received value ignored, added by server, (Integer)
                releaseDate: received value ignored, added by server, (Timestamp)
                expirationDate: timestamp containing the expiration date (Timestamp)
        }

### Delete

- To delete an assignment in a course the user needs to be authenticated as a professor teaching in it;
- Sending an empty POST to "/API/courses/{name}/assignments/{id}" will delete the assignment with the given id, if it exists;
- Professors can't delete an assignment if at least one student has read it(we assume that a student that has read the assignment is working on it);
- Deleting an assignment destroys also the homeworks related to it (all empty, since none of the students has read it)

