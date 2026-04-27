package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_messages_group_sent", columnList = "group_id, sent_at")
})
@Getter
@Setter
@NoArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false, length = 2000)
    private String text;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt = Instant.now();

    // echoed back so the sender can deduplicate against its optimistic update
    @Column(name = "client_id")
    private String clientId;

    @Column(name = "message_type")
    private String messageType = "TEXT";

    @Column(name = "material_id")
    private UUID materialId;

    @Column(name = "material_title", length = 500)
    private String materialTitle;

    @Column(name = "material_type", length = 50)
    private String materialType;
}
