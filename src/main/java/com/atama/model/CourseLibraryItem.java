package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.Id;

import java.util.UUID;

@Entity
@Table(name = "course_library_items")
@Getter
@Setter
@NoArgsConstructor
public class CourseLibraryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne
    @JoinColumn(name = "library_item_id")
    private LibraryItem libraryItem; // just a pointer to the original

    private String year;
    private String semester;
    private String description;
}