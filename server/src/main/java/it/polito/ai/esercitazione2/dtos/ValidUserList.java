package it.polito.ai.esercitazione2.dtos;

import lombok.Data;
import net.minidev.json.JSONObject;

import java.util.List;

@Data
public class ValidUserList {

    private List<JSONObject> list;

    public List<JSONObject> getList() {
        return list;
    }

    public void setList(List<JSONObject> list) {
        this.list = list;
    }


}
