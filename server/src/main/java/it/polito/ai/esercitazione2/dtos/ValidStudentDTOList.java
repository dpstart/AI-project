package it.polito.ai.esercitazione2.dtos;

import lombok.Data;

import javax.validation.Valid;
import java.util.List;

@Data
public class ValidStudentDTOList {

        @Valid
        private List<StudentDTO> list;

        public List<StudentDTO> getList() {
            return list;
        }

        public void setList(List<StudentDTO> list) {
            this.list = list;
        }


}

