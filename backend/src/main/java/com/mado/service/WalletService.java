package com.mado.service;

import com.mado.entity.User;
import com.mado.entity.WalletTransaction;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.UserRepository;
import com.mado.repository.WalletTransactionRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    private static final Map<Integer, Long> PACKAGES = Map.of(
            529, 500L,
            1055, 1000L,
            2649, 2500L,
            5299, 5000L,
            10529, 10000L
    );

    public long balance(User user) {
        return user.getCoinsBalance() == null ? 0L : user.getCoinsBalance();
    }

    @Transactional
    public Map<String, Object> createPurchaseIntent(User user, int amountCents) throws StripeException {
        Long coins = PACKAGES.get(amountCents);
        if (coins == null) {
            throw new BadRequestException("Invalid coin package");
        }
        Stripe.apiKey = stripeSecretKey;
        PaymentIntent intent = PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                        .setAmount((long) amountCents)
                        .setCurrency("usd")
                        .putMetadata("userId", user.getId().toString())
                        .putMetadata("coins", coins.toString())
                        .build()
        );
        return Map.of("clientSecret", intent.getClientSecret(), "coins", coins);
    }

    @Transactional
    public void creditCoins(UUID userId, long coins, int amountCents, String paymentIntentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        long current = user.getCoinsBalance() == null ? 0L : user.getCoinsBalance();
        user.setCoinsBalance(current + coins);
        userRepository.save(user);
        walletTransactionRepository.save(WalletTransaction.builder()
                .user(user)
                .coins(coins)
                .amountCents(amountCents)
                .type("PURCHASE")
                .stripePaymentId(paymentIntentId)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<WalletTransaction> history(User user, Pageable pageable) {
        return walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
    }
}
