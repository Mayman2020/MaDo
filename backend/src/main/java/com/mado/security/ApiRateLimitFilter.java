package com.mado.security;

import com.mado.util.ClientIp;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Soft global cap on REST API traffic per client IP (in-memory buckets; use a gateway for strict multi-node limits).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private static final int CAPACITY = 200;
    private static final Duration REFILL = Duration.ofMinutes(1);

    private final ConcurrentHashMap<String, Bucket> cache = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/")) {
            return true;
        }
        // Login has dedicated brute-force / attempt logic
        if ("/api/auth/login".equals(path)) {
            return true;
        }
        // Registration: separate short limiter in AuthController
        if ("/api/auth/register".equals(path)) {
            return true;
        }
        // Stripe webhook verifies HMAC; high volume not expected from browsers
        if (path.startsWith("/api/stripe/")) {
            return true;
        }
        // RTMP callbacks (often from nginx on internal network)
        if (path.startsWith("/api/streams/on-")) {
            return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String ip = ClientIp.from(request);
        Bucket bucket = cache.computeIfAbsent(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(CAPACITY)
                        .refillGreedy(CAPACITY, REFILL)
                        .build())
                .build());
        if (!bucket.tryConsume(1)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":429,\"message\":\"Too many requests. Slow down.\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
