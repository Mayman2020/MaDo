package com.mado.service;

import com.mado.config.StreamingProperties;
import com.mado.entity.Channel;
import com.mado.entity.Follow;
import com.mado.entity.User;
import com.mado.mail.EmailHtmlTemplates;
import com.mado.repository.FollowRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final FollowRepository followRepository;
    private final StreamingProperties streamingProperties;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Async
    public void notifyFollowersChannelLive(Channel channel) {
        if (mailFrom == null || mailFrom.isBlank()) {
            log.debug("Skipping live emails: spring.mail.username not set");
            return;
        }
        List<Follow> follows = followRepository.findAllByChannelIdWithFollower(channel.getId());
        String username = channel.getUser().getUsername();
        String title = channel.getTitle();
        String watchUrl = streamingProperties.getPublicWebUrl() + "/" + username;
        String html = EmailHtmlTemplates.channelLive(username, title, watchUrl);
        for (Follow f : follows) {
            User follower = f.getFollower();
            if (follower == null || follower.getEmail() == null) {
                continue;
            }
            sendHtml(follower.getEmail(), username + " is live on MaDo", html);
        }
    }

    @Async
    public void sendSubscriptionConfirmation(User subscriber, Channel channel, String tier, String amountLabel) {
        if (mailFrom == null || mailFrom.isBlank()) {
            log.debug("Skipping subscription email: spring.mail.username not set");
            return;
        }
        String html = EmailHtmlTemplates.subscriptionConfirmation(
                channel.getUser().getUsername(),
                tier,
                amountLabel,
                streamingProperties.getPublicWebUrl() + "/subscriptions"
        );
        sendHtml(subscriber.getEmail(), "Subscription confirmed — " + channel.getUser().getUsername(), html);
    }

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
