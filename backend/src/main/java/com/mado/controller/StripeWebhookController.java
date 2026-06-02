package com.mado.controller;

import com.mado.entity.Channel;
import com.mado.entity.SubscriptionTier;
import com.mado.entity.User;
import com.mado.repository.ChannelRepository;
import com.mado.repository.UserRepository;
import com.mado.service.EmailNotificationService;
import com.mado.service.SubscriptionService;
import com.mado.service.WalletService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final WalletService walletService;
    private final SubscriptionService subscriptionService;
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final EmailNotificationService emailNotificationService;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Stripe webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            Optional<StripeObject> dataObj = event.getDataObjectDeserializer().getObject();
            dataObj.ifPresent(obj -> {
                PaymentIntent intent = (PaymentIntent) obj;
                Map<String, String> meta = intent.getMetadata();
                try {
                    String type = meta.getOrDefault("type", "purchase");
                    if ("subscription".equals(type)) {
                        UUID subscriberId = UUID.fromString(meta.get("subscriberId"));
                        UUID channelId = UUID.fromString(meta.get("channelId"));
                        SubscriptionTier tier = SubscriptionTier.valueOf(meta.getOrDefault("tier", "TIER1"));
                        BigDecimal price = new BigDecimal(meta.getOrDefault("price", "4.99"));
                        User subscriber = userRepository.findById(subscriberId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                        subscriptionService.activate(subscriber, channelId, tier, price, intent.getId());
                        Channel ch = channelRepository.findByIdWithUser(channelId).orElse(null);
                        if (ch != null && ch.getUser() != null) {
                            String amountLabel = price.toPlainString() + " USD / month";
                            emailNotificationService.sendSubscriptionConfirmation(subscriber, ch, tier.name(), amountLabel);
                        }
                    } else {
                        UUID userId = UUID.fromString(meta.get("userId"));
                        long coins = Long.parseLong(meta.get("coins"));
                        int amountCents = intent.getAmount().intValue();
                        walletService.creditCoins(userId, coins, amountCents, intent.getId());
                    }
                } catch (Exception e) {
                    log.error("Failed to process payment_intent.succeeded webhook: {}", e.getMessage());
                }
            });
        }

        return ResponseEntity.ok("received");
    }
}
