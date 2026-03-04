package com.atama.dto.request;
import java.util.UUID;
public class DropZoneDTO {
    private UUID id;
    private double x;
    private double y;
    private String correctLabel;

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }

    public UUID getId() {
        return id; //not sure if this is needed
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setX(double x) {
        this.x = x;
    }

    public void setY(double y) {
        this.y = y;
    }
}
