package com.atama.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Library {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @OneToMany(mappedBy = "library", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Folder> folders = new ArrayList<>();

    @OneToMany(mappedBy = "library", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LibraryItem> items = new ArrayList<>();

    @Column(nullable = false)
    private boolean isPrivate = true;

    public Library(User user) {
        this.user = user;
    }

    public void addFolder(Folder folder) {
        folders.add(folder);
        folder.setLibrary(this);
    }

    public void addItem(LibraryItem item) {
        items.add(item);
        item.setLibrary(this);
        item.setFolder(null); // ensure loose item by default
    }
}