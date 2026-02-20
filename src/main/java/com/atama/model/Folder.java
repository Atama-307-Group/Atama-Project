package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Folder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "library_id")
    private Library library;

    @OneToMany(mappedBy = "folder")
    private List<LibraryItem> items = new ArrayList<>();    // Items inside a folder

    @Column
    private Instant lastAccessed;

    @CreationTimestamp
    private Instant createdAt;

    public Folder(String name) {
        this.name = name;
    }

    public void addItem(LibraryItem item) {     // Add an item to a folder
        if (!items.contains(item)) items.add(item);
    }

    public void removeItem(LibraryItem item) {  // Remove an item from a folder
        items.remove(item);
        item.setFolder(null);
    }
}
