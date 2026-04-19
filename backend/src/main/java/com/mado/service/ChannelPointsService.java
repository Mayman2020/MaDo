package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.ChannelPoint;
import com.mado.entity.ChannelPointReward;
import com.mado.entity.PointRedemption;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.ChannelPointRepository;
import com.mado.repository.ChannelPointRewardRepository;
import com.mado.repository.PointRedemptionRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChannelPointsService {

    private final ChannelPointRepository channelPointRepository;
    private final ChannelPointRewardRepository rewardRepository;
    private final PointRedemptionRepository redemptionRepository;
    private final ChannelAuthorizationHelper channelAuth;

    @Transactional
    public ChannelPoint balance(String channelUsername, User viewer) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        return channelPointRepository.findByUser_IdAndChannel_Id(viewer.getId(), ch.getId())
                .orElseGet(() -> channelPointRepository.save(
                        ChannelPoint.builder().user(viewer).channel(ch).points(0L).totalEarned(0L).build()));
    }

    @Transactional(readOnly = true)
    public List<ChannelPointReward> rewards(String channelUsername) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        return rewardRepository.findByChannelIdAndIsEnabledTrue(ch.getId());
    }

    @Transactional
    public ChannelPointReward createReward(String channelUsername, ChannelPointReward body, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        body.setChannel(ch);
        return rewardRepository.save(body);
    }

    @Transactional
    public PointRedemption redeem(String channelUsername, UUID rewardId, User viewer) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        ChannelPointReward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new NotFoundException("Reward not found"));
        if (!reward.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("Invalid reward");
        }
        ChannelPoint cp = channelPointRepository.findByUser_IdAndChannel_Id(viewer.getId(), ch.getId())
                .orElseGet(() -> channelPointRepository.save(
                        ChannelPoint.builder().user(viewer).channel(ch).points(0L).totalEarned(0L).build()));
        if (cp.getPoints() < reward.getCost()) {
            throw new BadRequestException("Not enough points");
        }
        cp.setPoints(cp.getPoints() - reward.getCost());
        channelPointRepository.save(cp);
        reward.setRedemptionCount((reward.getRedemptionCount() == null ? 0 : reward.getRedemptionCount()) + 1);
        rewardRepository.save(reward);
        return redemptionRepository.save(PointRedemption.builder()
                .reward(reward)
                .user(viewer)
                .channel(ch)
                .pointsSpent(reward.getCost())
                .status("FULFILLED")
                .build());
    }
}
