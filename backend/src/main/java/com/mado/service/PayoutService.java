package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.Payout;
import com.mado.repository.ChannelRepository;
import com.mado.repository.PayoutRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayoutService {

    private final PayoutRepository  payoutRepo;
    private final ChannelRepository channelRepo;

    /** Every day at 05:00 — process pending payouts */
    @Scheduled(cron = "0 0 5 * * *")
    @Transactional
    public void processPendingPayouts() {
        List<Payout> ready = payoutRepo.findReadyForProcessing();
        log.info("Processing {} pending payouts", ready.size());
        for (Payout p : ready) {
            try {
                // In production: call Stripe Transfer API here
                // stripe.transfers().create(params)
                p.setStatus("PAID");
                p.setPaidAt(Instant.now());
                payoutRepo.save(p);
                log.info("Payout {} paid: ${}", p.getId(), p.getAmountUsd());
            } catch (Exception e) {
                p.setStatus("FAILED");
                p.setNotes("Error: " + e.getMessage());
                payoutRepo.save(p);
                log.error("Payout {} failed: {}", p.getId(), e.getMessage());
            }
        }
    }

    public Page<Payout> getPayoutHistory(UUID channelId, int page) {
        return payoutRepo.findByChannelIdOrderByCreatedAtDesc(channelId, PageRequest.of(page, 20));
    }

    public Map<String, Object> getEarningsSummary(UUID channelId) {
        YearMonth now = YearMonth.now(ZoneOffset.UTC);
        BigDecimal pending    = payoutRepo.sumPendingByChannel(channelId);
        BigDecimal paidMonth  = payoutRepo.sumPaidByChannelAndPeriod(channelId, now.getYear(), now.getMonthValue());
        BigDecimal paidAll    = payoutRepo.sumPaidAllTimeByChannel(channelId);
        BigDecimal subRevenue = payoutRepo.sumPendingByChannelAndType(channelId, "REVENUE_SPLIT");
        BigDecimal milestoneR = payoutRepo.sumPendingByChannelAndType(channelId, "MILESTONE_REWARD");
        BigDecimal monthBonus = payoutRepo.sumPendingByChannelAndType(channelId, "MONTHLY_BONUS");

        Map<String, Object> result = new HashMap<>();
        result.put("pendingPayout",  pending);
        result.put("paidThisMonth",  paidMonth);
        result.put("paidAllTime",    paidAll);
        result.put("nextPayoutDate", now.plusMonths(1).atDay(1).toString());
        result.put("revenueBreakdown", Map.of(
                "subscriptions",    subRevenue,
                "monthlyBonus",     monthBonus,
                "milestoneRewards", milestoneR
        ));
        return result;
    }

    @Transactional
    public void createMonthlyBonuses(int year, int month) {
        channelRepo.findAll().forEach(ch -> {
            // Tier bonus is created by TierService after recalculate
            // This method is a hook for manual monthly bonus creation if needed
            log.debug("Monthly bonus check for channel {}", ch.getId());
        });
    }
}
