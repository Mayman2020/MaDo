package com.mado.service;

import com.mado.dto.engagement.PredictionCreateRequest;
import com.mado.dto.engagement.PredictionPlaceBetRequest;
import com.mado.entity.Channel;
import com.mado.entity.ChannelPoint;
import com.mado.entity.Prediction;
import com.mado.entity.PredictionEntry;
import com.mado.entity.PredictionOption;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.ChannelPointRepository;
import com.mado.repository.PredictionEntryRepository;
import com.mado.repository.PredictionOptionRepository;
import com.mado.repository.PredictionRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PredictionService {

    private final PredictionRepository predictionRepository;
    private final PredictionOptionRepository predictionOptionRepository;
    private final PredictionEntryRepository predictionEntryRepository;
    private final ChannelPointRepository channelPointRepository;
    private final ChannelAuthorizationHelper channelAuth;

    @Transactional(readOnly = true)
    public List<Prediction> active(String channelUsername) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        return predictionRepository.findByChannel_IdAndStatusOrderByCreatedAtDesc(ch.getId(), "ACTIVE");
    }

    @Transactional
    public Prediction create(String channelUsername, PredictionCreateRequest req, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        if (req.getOptionTitles().size() < 2) {
            throw new BadRequestException("At least two outcomes required");
        }
        int windowMin = req.getPredictionWindow() != null ? req.getPredictionWindow() : 30;
        if (windowMin < 1 || windowMin > 24 * 60) {
            throw new BadRequestException("Invalid prediction window");
        }
        Instant now = Instant.now();
        Prediction prediction = Prediction.builder()
                .channel(ch)
                .createdBy(actor)
                .title(req.getTitle())
                .status("ACTIVE")
                .predictionWindow(windowMin)
                .lockAt(now.plus(windowMin, ChronoUnit.MINUTES))
                .build();
        for (String t : req.getOptionTitles()) {
            PredictionOption o = PredictionOption.builder()
                    .prediction(prediction)
                    .title(t)
                    .build();
            prediction.getOptions().add(o);
        }
        return predictionRepository.save(prediction);
    }

    @Transactional
    public void placeBet(String channelUsername, UUID predictionId, PredictionPlaceBetRequest req, User user) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        Prediction prediction = predictionRepository.findById(predictionId)
                .orElseThrow(() -> new NotFoundException("Prediction not found"));
        if (!prediction.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("Invalid prediction");
        }
        if (!"ACTIVE".equals(prediction.getStatus())) {
            throw new BadRequestException("Prediction is closed");
        }
        if (prediction.getLockAt() != null && !Instant.now().isBefore(prediction.getLockAt())) {
            throw new BadRequestException("Betting locked");
        }
        if (predictionEntryRepository.findByPrediction_IdAndUser_Id(prediction.getId(), user.getId()).isPresent()) {
            throw new BadRequestException("You already placed a prediction");
        }
        PredictionOption option = predictionOptionRepository.findById(req.getOptionId())
                .orElseThrow(() -> new NotFoundException("Option not found"));
        if (!option.getPrediction().getId().equals(prediction.getId())) {
            throw new BadRequestException("Invalid option");
        }
        ChannelPoint cp = channelPointRepository.findByUser_IdAndChannel_Id(user.getId(), ch.getId())
                .orElseGet(() -> channelPointRepository.save(
                        ChannelPoint.builder().user(user).channel(ch).points(0L).totalEarned(0L).build()));
        int wager = req.getPointsWagered();
        if (cp.getPoints() < wager) {
            throw new BadRequestException("Not enough channel points");
        }
        cp.setPoints(cp.getPoints() - wager);
        channelPointRepository.save(cp);
        option.setTotalPoints((option.getTotalPoints() == null ? 0L : option.getTotalPoints()) + wager);
        option.setParticipantCount((option.getParticipantCount() == null ? 0 : option.getParticipantCount()) + 1);
        predictionOptionRepository.save(option);
        predictionEntryRepository.save(PredictionEntry.builder()
                .prediction(prediction)
                .option(option)
                .user(user)
                .pointsWagered(wager)
                .build());
    }

    @Transactional
    public void resolve(String channelUsername, UUID predictionId, UUID winningOptionId, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        Prediction prediction = predictionRepository.findById(predictionId)
                .orElseThrow(() -> new NotFoundException("Prediction not found"));
        if (!prediction.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("Invalid prediction");
        }
        if (!"ACTIVE".equals(prediction.getStatus())) {
            throw new BadRequestException("Prediction already settled");
        }
        PredictionOption winning = predictionOptionRepository.findById(winningOptionId)
                .orElseThrow(() -> new NotFoundException("Option not found"));
        if (!winning.getPrediction().getId().equals(prediction.getId())) {
            throw new BadRequestException("Invalid option");
        }
        List<PredictionEntry> entries = predictionEntryRepository.findByPrediction_Id(prediction.getId());
        long pool = entries.stream().mapToLong(PredictionEntry::getPointsWagered).sum();
        List<PredictionEntry> winners = entries.stream()
                .filter(e -> e.getOption() != null && winningOptionId.equals(e.getOption().getId()))
                .toList();
        long winningPool = winners.stream().mapToLong(PredictionEntry::getPointsWagered).sum();
        if (pool > 0 && winningPool == 0) {
            throw new BadRequestException("No wagers on the winning outcome");
        }
        for (PredictionEntry e : entries) {
            if (e.getOption() == null || !winningOptionId.equals(e.getOption().getId())) {
                e.setPointsWon(0);
            }
        }
        if (winningPool > 0) {
            long distributed = 0;
            for (int i = 0; i < winners.size(); i++) {
                PredictionEntry e = winners.get(i);
                long share = ((long) e.getPointsWagered() * pool) / winningPool;
                e.setPointsWon((int) share);
                distributed += share;
            }
            long dust = pool - distributed;
            int idx = 0;
            while (dust > 0 && !winners.isEmpty()) {
                PredictionEntry e = winners.get(idx % winners.size());
                e.setPointsWon(e.getPointsWon() + 1);
                dust--;
                idx++;
            }
        }
        predictionEntryRepository.saveAll(entries);
        for (PredictionEntry e : winners) {
            if (e.getPointsWon() == null || e.getPointsWon() <= 0) {
                continue;
            }
            User u = e.getUser();
            ChannelPoint cp = channelPointRepository.findByUser_IdAndChannel_Id(u.getId(), ch.getId())
                    .orElseGet(() -> channelPointRepository.save(
                            ChannelPoint.builder().user(u).channel(ch).points(0L).totalEarned(0L).build()));
            cp.setPoints(cp.getPoints() + e.getPointsWon());
            cp.setTotalEarned((cp.getTotalEarned() == null ? 0L : cp.getTotalEarned()) + e.getPointsWon());
            channelPointRepository.save(cp);
        }
        prediction.setWinningOptionId(winningOptionId);
        prediction.setStatus("RESOLVED");
        prediction.setResolvedAt(Instant.now());
        predictionRepository.save(prediction);
    }

    @Transactional
    public void cancel(String channelUsername, UUID predictionId, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        Prediction prediction = predictionRepository.findById(predictionId)
                .orElseThrow(() -> new NotFoundException("Prediction not found"));
        if (!prediction.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("Invalid prediction");
        }
        if (!"ACTIVE".equals(prediction.getStatus())) {
            throw new BadRequestException("Prediction already settled");
        }
        List<PredictionEntry> entries = predictionEntryRepository.findByPrediction_Id(prediction.getId());
        for (PredictionEntry e : entries) {
            User u = e.getUser();
            int refund = e.getPointsWagered();
            ChannelPoint cp = channelPointRepository.findByUser_IdAndChannel_Id(u.getId(), ch.getId())
                    .orElseGet(() -> channelPointRepository.save(
                            ChannelPoint.builder().user(u).channel(ch).points(0L).totalEarned(0L).build()));
            cp.setPoints(cp.getPoints() + refund);
            channelPointRepository.save(cp);
        }
        prediction.setStatus("CANCELLED");
        prediction.setResolvedAt(Instant.now());
        predictionRepository.save(prediction);
    }
}
