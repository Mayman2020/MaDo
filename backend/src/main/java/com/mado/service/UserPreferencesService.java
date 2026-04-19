package com.mado.service;

import com.mado.entity.User;
import com.mado.entity.UserPreferences;
import com.mado.repository.UserPreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserPreferencesService {

    private final UserPreferencesRepository userPreferencesRepository;

    @Transactional(readOnly = true)
    public UserPreferences getOrCreate(User user) {
        return userPreferencesRepository.findByUser_Id(user.getId())
                .orElseGet(() -> userPreferencesRepository.save(UserPreferences.builder().user(user).build()));
    }

    @Transactional
    public UserPreferences patch(User user, UserPreferences patch) {
        UserPreferences p = getOrCreate(user);
        if (patch.getChatColor() != null) {
            p.setChatColor(patch.getChatColor());
        }
        if (patch.getDarkMode() != null) {
            p.setDarkMode(patch.getDarkMode());
        }
        if (patch.getAutoplay() != null) {
            p.setAutoplay(patch.getAutoplay());
        }
        if (patch.getDefaultQuality() != null) {
            p.setDefaultQuality(patch.getDefaultQuality());
        }
        if (patch.getLanguage() != null) {
            p.setLanguage(patch.getLanguage());
        }
        if (patch.getEmailOnLive() != null) {
            p.setEmailOnLive(patch.getEmailOnLive());
        }
        if (patch.getEmailOnFollow() != null) {
            p.setEmailOnFollow(patch.getEmailOnFollow());
        }
        if (patch.getEmailOnSub() != null) {
            p.setEmailOnSub(patch.getEmailOnSub());
        }
        if (patch.getPushOnLive() != null) {
            p.setPushOnLive(patch.getPushOnLive());
        }
        return userPreferencesRepository.save(p);
    }
}
