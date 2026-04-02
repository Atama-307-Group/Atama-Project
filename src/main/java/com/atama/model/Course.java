package com.atama.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "university_id")
    @JsonIgnore
    private University university;

    private String courseCode;      // e.g., CS 30700
    private String courseName;      // e.g. Software Engineering

    @OneToMany(mappedBy = "course")
    @JsonIgnore
    private List<CourseLibraryItem> items;
}