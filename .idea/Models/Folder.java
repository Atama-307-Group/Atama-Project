package com.example.library.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity         // Marks this class as a JPA entity
@Table(name = "folders",
        uniqueConstraints = @UniqueConstraint(columnNames = {"ownerUserId", "name"}))
        // A single user cannot create two folders with the same name.
public class Folder {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id; // TODO figure out what ID type

    @Column(nullable = false)
    private UUID ownerUserId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Folder() {}

    public Folder(String ownerUserId, String name) {
        this.ownerUserId = ownerUserId;
        this.name = name;
    }

    public Long getId() { return id; }
    public String getOwnerUserId() { return ownerUserId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; } // Allows renaming folder
    public Instant getCreatedAt() { return createdAt; }
}