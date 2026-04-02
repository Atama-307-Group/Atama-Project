package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("PDF")
@Getter
@Setter
public class PDF extends LibraryItem {
    @Column(nullable = false)
    private String filePath;
}