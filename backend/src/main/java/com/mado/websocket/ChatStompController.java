package com.mado.websocket;

import com.mado.dto.ChatSendRequest;
import com.mado.entity.User;
import com.mado.repository.UserRepository;
import com.mado.security.JwtService;
import com.mado.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.Optional;
import java.util.UUID;

/**
 * STOMP: client sends to /app/chat/{channelId} with Authorization: Bearer header.
 * Subscriptions: /topic/channel.{channelId}.messages
 */
@Controller
@RequiredArgsConstructor
public class ChatStompController {

    private final ChatService chatService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @MessageMapping("/chat/{channelId}")
    public void sendStomp(
            @DestinationVariable UUID channelId,
            @Payload ChatSendRequest payload,
            SimpMessageHeaderAccessor accessor) {
        String auth = accessor.getFirstNativeHeader("Authorization");
        Optional<User> user = resolveUser(auth);
        if (user.isEmpty()) {
            return;
        }
        chatService.send(channelId, payload, user.get());
    }

    private Optional<User> resolveUser(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        String jwt = authorizationHeader.substring(7).trim();
        try {
            String email = jwtService.extractUsername(jwt);
            return userRepository.findByEmail(email);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
