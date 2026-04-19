package com.mado.service;

import com.mado.entity.Notification;
import com.mado.entity.User;
import com.mado.exception.NotFoundException;
import com.mado.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Page<Notification> mine(User user, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    @Transactional
    public void markRead(User user, UUID id) {
        Notification n = notificationRepository.findById(id).orElseThrow(() -> new NotFoundException("Not found"));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new com.mado.exception.BadRequestException("Not allowed");
        }
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(User user) {
        notificationRepository.markAllReadForUser(user.getId());
    }
}
