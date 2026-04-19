package com.mado.service;

import com.mado.dto.moderation.BanRequest;
import com.mado.dto.moderation.BannedWordRequest;
import com.mado.entity.Ban;
import com.mado.entity.BannedWord;
import com.mado.entity.Channel;
import com.mado.entity.Moderator;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.BanRepository;
import com.mado.repository.BannedWordRepository;
import com.mado.repository.ModeratorRepository;
import com.mado.repository.UserRepository;
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
public class ModerationService {

    private final ChannelAuthorizationHelper channelAuth;
    private final BanRepository banRepository;
    private final BannedWordRepository bannedWordRepository;
    private final ModeratorRepository moderatorRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Ban> listBans(String channelUsername, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        return banRepository.findByChannelIdOrderByCreatedAtDesc(ch.getId());
    }

    @Transactional
    public Ban ban(String channelUsername, BanRequest req, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        User target = userRepository.findByUsername(req.getTargetUsername())
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (target.getId().equals(ch.getUser().getId())) {
            throw new BadRequestException("Cannot ban channel owner");
        }
        Ban ban = Ban.builder()
                .channel(ch)
                .bannedUser(target)
                .bannedBy(actor)
                .reason(req.getReason())
                .isPermanent(req.isPermanent())
                .isTimeout(!req.isPermanent() && req.getTimeoutMinutes() != null && req.getTimeoutMinutes() > 0)
                .timeoutUntil(req.isPermanent() || req.getTimeoutMinutes() == null
                        ? null
                        : Instant.now().plus(req.getTimeoutMinutes(), ChronoUnit.MINUTES))
                .build();
        return banRepository.save(ban);
    }

    @Transactional
    public void unban(String channelUsername, UUID banId, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        Ban b = banRepository.findById(banId).orElseThrow(() -> new NotFoundException("Ban not found"));
        if (!b.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("Invalid ban");
        }
        banRepository.delete(b);
    }

    @Transactional(readOnly = true)
    public List<Moderator> listMods(String channelUsername, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        return moderatorRepository.findByChannelId(ch.getId());
    }

    @Transactional
    public void addMod(String channelUsername, UUID modUserId, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwner(ch, actor);
        User mod = userRepository.findById(modUserId).orElseThrow(() -> new NotFoundException("User not found"));
        if (mod.getId().equals(ch.getUser().getId())) {
            throw new BadRequestException("Owner is already a moderator");
        }
        if (moderatorRepository.existsByChannelIdAndUserId(ch.getId(), mod.getId())) {
            return;
        }
        moderatorRepository.save(Moderator.builder().channel(ch).user(mod).addedBy(actor).build());
    }

    @Transactional
    public void removeMod(String channelUsername, UUID modUserId, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwner(ch, actor);
        moderatorRepository.deleteByChannelIdAndUserId(ch.getId(), modUserId);
    }

    @Transactional(readOnly = true)
    public List<BannedWord> listWords(String channelUsername, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        return bannedWordRepository.findByChannelId(ch.getId());
    }

    @Transactional
    public BannedWord addWord(String channelUsername, BannedWordRequest req, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        return bannedWordRepository.save(BannedWord.builder().channel(ch).word(req.getWord().trim()).build());
    }

    @Transactional
    public void removeWord(String channelUsername, UUID wordId, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        BannedWord w = bannedWordRepository.findById(wordId).orElseThrow(() -> new NotFoundException("Not found"));
        if (!w.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("Invalid word");
        }
        bannedWordRepository.delete(w);
    }
}
