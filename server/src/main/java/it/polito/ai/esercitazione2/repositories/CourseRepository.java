package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Course;
import it.polito.ai.esercitazione2.entities.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course,String> {


    @Query("SELECT s FROM Student s INNER JOIN s.teams t INNER JOIN t.course c WHERE c.name=:courseName OR c.acronime=:courseName")
    List<Student> getStudentsInTeams(String courseName);

    @Override
    @Query("SELECT c FROM Course c WHERE c.name=:course OR c.acronime=:course")
    Course getOne(String course);


    @Query("SELECT s1 FROM Student s1 INNER JOIN s1.courses c  WHERE c.name=:courseName AND s1.id NOT IN (" +
            "SELECT s.id FROM Student s INNER JOIN s.teams t INNER JOIN t.course c WHERE (c.name=:courseName OR c.acronime=:courseName) AND t.status=1)")
    List<Student> getStudentsNotInTeams(String courseName);



    boolean existsByAcronime(String courseName);
}
