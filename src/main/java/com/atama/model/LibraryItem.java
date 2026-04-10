package com.atama.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.List;
import java.util.UUID;


@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type")
@Getter
@Setter
public abstract class LibraryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "library_id", nullable = false)
    private Library library;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    @JoinColumn(name = "folder_id") // nullable => loose
    private Folder folder;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    @Column
    private Instant lastAccessed;

    @Column(nullable = false)
    private boolean starred = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LibraryItemType itemType;

    @OneToMany(mappedBy = "libraryItem")
    @JsonIgnore
    private List<CourseLibraryItem> courseAssignments;

    @JsonProperty("isPublic")
    @Column(name = "is_public", nullable = false)
    private boolean isPublic = true;
}
