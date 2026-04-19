package com.mado.service;

import com.mado.entity.Subscription;
import com.mado.entity.User;
import com.mado.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionQueryService {

    private final SubscriptionRepository subscriptionRepository;

    @Transactional(readOnly = true)
    public List<Subscription> myActiveSubscriptions(User user) {
        return subscriptionRepository.findBySubscriber_IdAndIsActiveTrue(user.getId());
    }
}
