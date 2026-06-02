package com.mado.config;

import com.mado.security.ApiRateLimitFilter;
import com.mado.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ApiRateLimitFilter apiRateLimitFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final org.springframework.security.core.userdetails.UserDetailsService userDetailsService;
    private final org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/change-password").authenticated()
                        .requestMatchers("/api/auth/2fa/**").authenticated()
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/auth/verify-email",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/emotes/global").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/wallet/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/wallet/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/stripe/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**", "/api/clips/**", "/api/search/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/live").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/stats").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/vods", "/api/channels/*/vods/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/clips").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/emotes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/polls").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/predictions").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/points/rewards").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/schedules").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/donations").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/gifts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*/messages").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/channels/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/streams/**").permitAll()
                        .requestMatchers("/api/streams/on-publish", "/api/streams/on-publish-done", "/api/streams/on-play").permitAll()
                        // Creator Incentive Program — public GET endpoints
                        .requestMatchers(HttpMethod.GET, "/api/rankings/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/stats/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tiers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tiers/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/milestones").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/milestones/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/goals/*").permitAll()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                // Both custom filters run before UsernamePasswordAuthenticationFilter.
                // Insertion order determines their relative position:
                // apiRateLimitFilter → jwtAuthenticationFilter → UsernamePasswordAuthenticationFilter
                .addFilterBefore(apiRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
