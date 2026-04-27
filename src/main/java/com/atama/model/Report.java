package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(foreignKeyDefinition = "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL"))
    private User user;   // The user who created the report

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType type;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column
    private Instant resolvedAt; // When the report was resolved

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id", foreignKey = @ForeignKey(foreignKeyDefinition = "FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL"))
    private User reportedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_library_item_id")
    private LibraryItem reportedLibraryItem;
}