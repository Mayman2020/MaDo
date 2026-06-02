package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.Subscription;
import com.mado.entity.SubscriptionTier;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.ChannelRepository;
import com.mado.repository.SubscriptionRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final ChannelRepository channelRepository;

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    @Transactional
    public Map<String, Object> createSubscriptionIntent(UUID channelId, String tierStr, User subscriber) throws StripeException {
        Channel ch = channelRepository.findById(channelId)
                .orElseThrow(() -> new NotFoundException("Channel not found"));

        if (!Boolean.TRUE.equals(ch.getIsSubscriptionEnabled())) {
            throw new BadRequestException("Subscriptions are not enabled for this channel");
        }

        SubscriptionTier tier = switch (tierStr.toUpperCase()) {
            case "TIER2" -> SubscriptionTier.TIER2;
            case "TIER3" -> SubscriptionTier.TIER3;
            default -> SubscriptionTier.TIER1;
        };

        BigDecimal price = switch (tier) {
            case TIER2 -> ch.getSubPriceTier2() != null ? ch.getSubPriceTier2() : new BigDecimal("9.99");
            case TIER3 -> ch.getSubPriceTier3() != null ? ch.getSubPriceTier3() : new BigDecimal("24.99");
            default -> ch.getSubPriceTier1() != null ? ch.getSubPriceTier1() : new BigDecimal("4.99");
        };

        long amountCents = price.multiply(new BigDecimal(100)).longValue();

        Stripe.apiKey = stripeSecretKey;
        PaymentIntent intent = PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                        .setAmount(amountCents)
                        .setCurrency("usd")
                        .putMetadata("type", "subscription")
                        .putMetadata("subscriberId", subscriber.getId().toString())
                        .putMetadata("channelId", channelId.toString())
                        .putMetadata("tier", tier.name())
                        .putMetadata("price", price.toPlainString())
                        .build()
        );

        return Map.of(
                "clientSecret", intent.getClientSecret(),
                "tier", tier.name(),
                "price", price
        );
    }

    @Transactional
    public Subscription activate(User subscriber, UUID channelId, SubscriptionTier tier, BigDecimal price, String stripePaymentId) {
        Channel ch = channelRepository.findById(channelId)
                .orElseThrow(() -> new NotFoundException("Channel not found"));

        subscriptionRepository.findBySubscriber_IdAndChannel_IdAndIsActiveTrue(subscriber.getId(), channelId)
                .ifPresent(s -> { s.setIsActive(false); subscriptionRepository.save(s); });

        Subscription sub = Subscription.builder()
                .subscriber(subscriber)
                .channel(ch)
                .tier(tier)
                .price(price)
                .stripeSubId(stripePaymentId)
                .isActive(true)
                .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
                .build();

        ch.setSubscriberCount((ch.getSubscriberCount() == null ? 0 : ch.getSubscriberCount()) + 1);
        channelRepository.save(ch);

        return subscriptionRepository.save(sub);
    }
}
