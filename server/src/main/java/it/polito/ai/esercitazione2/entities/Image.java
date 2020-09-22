package it.polito.ai.esercitazione2.entities;

import lombok.Data;

import javax.persistence.*;


@Entity
@Data
public class Image {
    public Image() {
    }

    public Image(Image image) {
        this.type = image.type;
        this.picByte = image.picByte;
    }


    public Image(String type, byte[] picByte) {
        this.type = type;
        this.picByte = picByte;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String type;
    //image bytes can have large lengths so we specify a value
    //which is more than the default length for picByte column
    @Column(length = 500000)
    private byte[] picByte;

    public Long getId() {
        return id;
    }

    public void setId(Long name) {
        this.id = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public byte[] getPicByte() {
        return picByte;
    }

    public void setPicByte(byte[] picByte) {
        this.picByte = picByte;
    }
}
