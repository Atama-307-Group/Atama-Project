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
}
