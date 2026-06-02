package com.mado.service;

import com.mado.dto.AuthRequest;
import com.mado.dto.RefreshRequest;
import com.mado.dto.RefreshTokenResponse;
import com.mado.dto.RegisterRequest;
import com.mado.dto.TwoFactorSetupResponse;
import com.mado.dto.UserResponse;
import com.mado.entity.RefreshToken;
import com.mado.entity.Role;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.util.TextSanitizer;
import com.mado.mapper.UserMapper;
import com.mado.repository.RefreshTokenRepository;
import com.mado.repository.UserRepository;
import com.mado.security.CustomUserDetails;
import com.mado.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final TotpService totpService;

    @Transactional
    public RefreshTokenResponse register(RegisterRequest request) {
        String username = TextSanitizer.plainText(request.getUsername(), 30);
        if (username.length() < 3) {
            throw new BadRequestException("Invalid username");
        }
        String email = TextSanitizer.plainText(request.getEmail().toLowerCase(), 255);
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already in use");
        }
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username is already in use");
        }

        String displayName = request.getDisplayName() == null || request.getDisplayName().isBlank()
                ? username
                : TextSanitizer.plainText(request.getDisplayName(), 50);

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(displayName)
                .role(Role.VIEWER)
                .isActive(true)
                .isVerified(false)
                .isBanned(false)
                .build();
        user = userRepository.save(user);

        UserDetails principal = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build());

        return RefreshTokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toResponse(user))
                .build();
    }

    public RefreshTokenResponse login(AuthRequest request) {
        String identifier = request.getIdentifier().trim();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
        );

        User user = (identifier.contains("@")
                ? userRepository.findByEmail(identifier.toLowerCase())
                : userRepository.findByUsername(identifier))
                .orElseThrow(() -> new BadRequestException("User not found"));
        if (Boolean.TRUE.equals(user.getTwoFaEnabled())) {
            String code = request.getTotpCode();
            if (code == null || code.isBlank()) {
                throw new BadRequestException("TOTP_REQUIRED");
            }
            if (!totpService.verify(user.getTwoFaSecret(), code)) {
                throw new BadRequestException("Invalid authenticator code");
            }
        }
        UserDetails principal = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build());

        return RefreshTokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toResponse(user))
                .build();
    }

    public RefreshTokenResponse refresh(RefreshRequest request) {
        var tokenRecord = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));
        if (tokenRecord.getExpiresAt().isBefore(java.time.Instant.now())) {
            refreshTokenRepository.delete(tokenRecord);
            throw new BadRequestException("Refresh token expired");
        }

        User user = tokenRecord.getUser();
        UserDetails principal = new CustomUserDetails(user);

        return RefreshTokenResponse.builder()
                .accessToken(jwtService.generateAccessToken(principal))
                .refreshToken(tokenRecord.getToken())
                .user(userMapper.toResponse(user))
                .build();
    }

    public void logout(RefreshRequest request) {
        refreshTokenRepository.deleteByToken(request.getRefreshToken());
    }

    @Transactional
    public void changePassword(User user, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public UserResponse me(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new BadRequestException("User not found"));
        return userMapper.toResponse(user);
    }

    public Map<String, Object> twoFactorStatus(User user) {
        User u = userRepository.findById(user.getId()).orElseThrow(() -> new BadRequestException("User not found"));
        return Map.of("enabled", Boolean.TRUE.equals(u.getTwoFaEnabled()));
    }

    @Transactional
    public TwoFactorSetupResponse twoFactorBegin(User user, String password) {
        User u = userRepository.findById(user.getId()).orElseThrow(() -> new BadRequestException("User not found"));
        if (!passwordEncoder.matches(password, u.getPasswordHash())) {
            throw new BadRequestException("Incorrect password");
        }
        if (Boolean.TRUE.equals(u.getTwoFaEnabled())) {
            throw new BadRequestException("2FA is already enabled");
        }
        String secret = totpService.generateSecret();
        u.setTwoFaSecret(secret);
        userRepository.save(u);
        return TwoFactorSetupResponse.builder()
                .secret(secret)
                .otpauthUrl(totpService.otpAuthUri("MaDo", u.getEmail(), secret))
                .build();
    }

    @Transactional
    public void twoFactorConfirm(User user, String code) {
        User u = userRepository.findById(user.getId()).orElseThrow(() -> new BadRequestException("User not found"));
        if (u.getTwoFaSecret() == null || u.getTwoFaSecret().isBlank()) {
            throw new BadRequestException("Run begin setup first");
        }
        if (!totpService.verify(u.getTwoFaSecret(), code)) {
            throw new BadRequestException("Invalid authenticator code");
        }
        u.setTwoFaEnabled(true);
        userRepository.save(u);
    }

    @Transactional
    public void twoFactorDisable(User user, String password, String code) {
        User u = userRepository.findById(user.getId()).orElseThrow(() -> new BadRequestException("User not found"));
        if (!Boolean.TRUE.equals(u.getTwoFaEnabled())) {
            throw new BadRequestException("2FA is not enabled");
        }
        if (!passwordEncoder.matches(password, u.getPasswordHash())) {
            throw new BadRequestException("Incorrect password");
        }
        if (!totpService.verify(u.getTwoFaSecret(), code)) {
            throw new BadRequestException("Invalid authenticator code");
        }
        u.setTwoFaEnabled(false);
        u.setTwoFaSecret(null);
        userRepository.save(u);
    }
}
