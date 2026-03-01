package com.atama.dto.request;

public class DropZoneDTO {
    private Long id;
    private double x;
    private double y;
    private String correctLabel;

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }

    public Long getId() {
        return id; //not sure if this is needed
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setX(double x) {
        this.x = x;
    }

    public void setY(double y) {
        this.y = y;
    }
}
