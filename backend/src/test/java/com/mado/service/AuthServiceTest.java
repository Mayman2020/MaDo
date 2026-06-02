package com.mado.service;

import com.mado.dto.AuthRequest;
import com.mado.dto.RegisterRequest;
import com.mado.entity.Role;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.mapper.UserMapper;
import com.mado.repository.RefreshTokenRepository;
import com.mado.repository.UserRepository;
import com.mado.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository         userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock AuthenticationManager  authenticationManager;
    @Mock JwtService             jwtService;
    @Mock UserMapper             userMapper;
    @Mock TotpService            totpService;

    private PasswordEncoder passwordEncoder;
    private AuthService     authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(
                userRepository, refreshTokenRepository, passwordEncoder,
                authenticationManager, jwtService, userMapper, totpService);
    }

    // ── Register ─────────────────────────────────────────────────

    @Test
    void register_validRequest_returnsTokenPair() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setEmail("alice@example.com");
        req.setPassword("P@ssword1!");
        req.setDisplayName("Alice");

        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByUsername(any())).thenReturn(false);
        User saved = User.builder()
                .id(UUID.randomUUID()).username("alice")
                .email("alice@example.com").role(Role.VIEWER)
                .isActive(true).isVerified(false).isBanned(false)
                .build();
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtService.generateAccessToken(any())).thenReturn("access-tok");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-tok");

        var result = authService.register(req);

        assertThat(result.getAccessToken()).isEqualTo("access-tok");
        assertThat(result.getRefreshToken()).isEqualTo("refresh-tok");
        verify(refreshTokenRepository).save(any());
    }

    @Test
    void register_duplicateEmail_throwsBadRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("bob");
        req.setEmail("taken@example.com");
        req.setPassword("P@ssword1!");

        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email is already in use");
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_duplicateUsername_throwsBadRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("taken");
        req.setEmail("new@example.com");
        req.setPassword("P@ssword1!");

        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Username is already in use");
    }

    @Test
    void register_shortUsername_throwsBadRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("ab"); // 2 chars — sanitizer drops it
        req.setEmail("short@example.com");
        req.setPassword("P@ssword1!");

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid username");
    }

    // ── Login + 2FA ──────────────────────────────────────────────

    @Test
    void login_totpEnabled_missingCode_requiresTotpError() {
        AuthRequest req = new AuthRequest();
        req.setEmail("alice@example.com");
        req.setPassword("P@ssword1!");
        // totpCode intentionally not set

        User user = User.builder()
                .id(UUID.randomUUID()).email("alice@example.com")
                .twoFaEnabled(true).twoFaSecret("BASE32SECRET")
                .role(Role.VIEWER).isActive(true).isBanned(false)
                .build();

        doNothing().when(authenticationManager).authenticate(any());
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("TOTP_REQUIRED");
    }

    @Test
    void login_totpEnabled_wrongCode_throwsBadRequest() {
        AuthRequest req = new AuthRequest();
        req.setEmail("alice@example.com");
        req.setPassword("P@ssword1!");
        req.setTotpCode("000000");

        User user = User.builder()
                .id(UUID.randomUUID()).email("alice@example.com")
                .twoFaEnabled(true).twoFaSecret("BASE32SECRET")
                .role(Role.VIEWER).isActive(true).isBanned(false)
                .build();

        doNothing().when(authenticationManager).authenticate(any());
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(totpService.verify("BASE32SECRET", "000000")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid authenticator code");
    }

    @Test
    void login_totpEnabled_correctCode_returnsTokens() {
        AuthRequest req = new AuthRequest();
        req.setEmail("alice@example.com");
        req.setPassword("P@ssword1!");
        req.setTotpCode("123456");

        User user = User.builder()
                .id(UUID.randomUUID()).email("alice@example.com")
                .twoFaEnabled(true).twoFaSecret("BASE32SECRET")
                .role(Role.VIEWER).isActive(true).isBanned(false)
                .build();

        doNothing().when(authenticationManager).authenticate(any());
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(totpService.verify("BASE32SECRET", "123456")).thenReturn(true);
        when(jwtService.generateAccessToken(any())).thenReturn("access-tok");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-tok");

        var result = authService.login(req);

        assertThat(result.getAccessToken()).isEqualTo("access-tok");
        verify(refreshTokenRepository).save(any());
    }

    // ── Change password ──────────────────────────────────────────

    @Test
    void changePassword_wrongCurrentPassword_throwsBadRequest() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("correct"))
                .role(Role.VIEWER)
                .build();

        assertThatThrownBy(() -> authService.changePassword(user, "wrong", "newPass1!"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Current password is incorrect");
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_correctCurrent_savesNewHash() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("correct"))
                .role(Role.VIEWER)
                .build();
        when(userRepository.save(any())).thenReturn(user);

        authService.changePassword(user, "correct", "newPass1!");

        verify(userRepository).save(user);
        assertThat(passwordEncoder.matches("newPass1!", user.getPasswordHash())).isTrue();
    }
}
