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




###Professors:

Registration: localhost:8080/API/professors (POST)

"professor" (part) {"id":"1000",
"name":"Antonio",
"firstName":"Servetti",
"email":"antonio.servetti@polito.it",
"password":"servetti"
}

"image" (part) ... the image

###Students :

Registration: localhost:8080/API/students (POST)

"student" (part) {"id":"1000",
"name":"Antonio",
"firstName":"Servetti",
"email":"antonio.servetti@studenti.polito.it",
"password":"servetti"
}

"image" (part) ... the image


###Courses:

Creation: http://localhost:8080/API/courses/ (POST)
Authentication required

{
    "name":"Applicazioni Internet",
    "acronime":"AI",
    "max":10
    "min": optional
}

Enable:  http://localhost:8080/API/courses/<nome oppure acronime del corso>/enable (get)



Share ownership: http://localhost:8080/API/courses/<nome oppure acronime del corso>/share (POST)

Authentication required
{
	"id":"<id del prof con cui condividere>"
}

EnrollOne:  http://localhost:8080/API/courses/<nome oppure acronime del corso>/enrollOne (POST)
Authentication required
{
	"id":"<id delLO STUDENTE DA enroll>"
}


EnrollManyCSV:  http://localhost:8080/API/courses/<nome oppure acronime del corso>/enrollManyCSV (POST)
Authentication required

"file"(part): file.csv

file.csv (colonna "id" con id dei vari studenti si vuole aggiungere






