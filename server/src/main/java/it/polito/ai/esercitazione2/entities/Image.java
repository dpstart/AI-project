package it.polito.ai.esercitazione2.entities;

import javax.persistence.*;


@Entity
@Table
public class Image {
    public Image() {
        super();
    }
    public Image(String type, byte[] picByte) {
        this.type = type;
        this.picByte = picByte;
    }
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private String name;

    private String type;
    //image bytes can have large lengths so we specify a value
    //which is more than the default length for picByte column
    @Column(length=500000)
    private byte[] picByte;
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
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
        System.out.println(picByte.length);
        this.picByte = picByte;
    }
}