package com.atama.repository;

import com.atama.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findTop400ByGroupIdOrderBySentAtAsc(UUID groupId);

    long countByGroupId(UUID groupId);

    @Modifying
    @Query(value = """
            DELETE FROM chat_messages
            WHERE id IN (
                SELECT id FROM chat_messages
                WHERE group_id = :groupId
                ORDER BY sent_at ASC
                LIMIT :count
            )
            """, nativeQuery = true)
    void deleteOldestByGroupId(@Param("groupId") UUID groupId, @Param("count") long count);
}
