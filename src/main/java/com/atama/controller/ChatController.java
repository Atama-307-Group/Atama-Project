package com.atama.controller;

import com.atama.model.ChatMessage;
import com.atama.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private static final int MAX_MESSAGES = 400;

    private final ChatMessageRepository chatMessageRepository;

    @MessageMapping("/groups/{groupId}/chat")
    @SendTo("/topic/groups/{groupId}")
    @Transactional
    public ChatMessage handleMessage(
            @DestinationVariable UUID groupId,
            @Payload ChatMessage incoming) {

        incoming.setGroupId(groupId);
        incoming.setSentAt(java.time.Instant.now());
        ChatMessage saved = chatMessageRepository.save(incoming);

        long count = chatMessageRepository.countByGroupId(groupId);
        if (count > MAX_MESSAGES) {
            chatMessageRepository.deleteOldestByGroupId(groupId, count - MAX_MESSAGES);
        }

        return saved;
    }

    @GetMapping("/api/groups/{groupId}/messages")
    @ResponseBody
    public List<ChatMessage> getMessages(@PathVariable UUID groupId) {
        return chatMessageRepository.findTop400ByGroupIdOrderBySentAtAsc(groupId);
    }
}
