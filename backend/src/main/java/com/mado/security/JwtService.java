package com.mado.security;

import com.mado.config.JwtProperties;
import com.mado.entity.RefreshToken;
import com.mado.entity.User;
import com.mado.repository.RefreshTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;
    private final RefreshTokenRepository refreshTokenRepository;

    public String generateAccessToken(UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).user();
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("username", user.getUsername());
        extraClaims.put("role", user.getRole().name());
        extraClaims.put("email", user.getEmail());
        return buildToken(extraClaims, userDetails, jwtProperties.getAccessTokenExpiry());
    }

    public String generateRefreshToken(UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).user();
        String token = buildToken(Map.of("userId", user.getId()), userDetails, jwtProperties.getRefreshTokenExpiry());
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshTokenExpiry()))
                .build();
        refreshTokenRepository.save(refreshToken);
        return token;
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expirationMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        } catch (IllegalArgumentException ex) {
            keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
