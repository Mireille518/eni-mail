package mg.eni.email.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.eni.email.config.JwtProperties;
import mg.eni.email.document.RefreshToken;
import mg.eni.email.document.User;
import mg.eni.email.dto.response.LoginResponse;
import mg.eni.email.dto.response.UserDto;
import mg.eni.email.enums.AccountStatus;
import mg.eni.email.exception.TooManyRequestsException;
import mg.eni.email.exception.UnauthorizedException;
import mg.eni.email.repository.RefreshTokenRepository;
import mg.eni.email.repository.UserRepository;
import mg.eni.email.security.JwtService;
import mg.eni.email.security.LoginAttemptService;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    public record AuthResult(LoginResponse body, String rawRefreshToken, long refreshTtlSeconds) { }

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginAttemptService loginAttempts;
    private final JwtProperties jwtProperties;

    public AuthResult login(String rawEmail, String rawPassword) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase();
        if (loginAttempts.isBlocked(email)) {
            throw new TooManyRequestsException("Trop de tentatives, reessayez dans quelques minutes");
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || user.getStatus() != AccountStatus.ACTIVE
                || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            loginAttempts.onFailure(email);
            throw new BadCredentialsException("Email ou mot de passe invalide");
        }

        loginAttempts.onSuccess(email);
        return issueTokens(user);
    }

    public AuthResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new UnauthorizedException("Refresh token manquant");
        }
        Claims claims;
        try {
            claims = jwtService.parseOfType(rawRefreshToken, JwtService.TokenType.REFRESH);
        } catch (Exception ex) {
            throw new UnauthorizedException("Refresh token invalide");
        }

        String tokenHash = sha256(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> {
                    // reutilisation d'un token revoque ou inconnu : revoquer tout pour l'utilisateur
                    refreshTokenRepository.deleteByUserId(claims.getSubject());
                    return new UnauthorizedException("Refresh token revoque");
                });

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token expire");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Utilisateur inconnu"));
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new UnauthorizedException("Compte desactive");
        }

        // Rotation
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return issueTokens(user);
    }

    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        try {
            String hash = sha256(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(hash).ifPresent(t -> {
                t.setRevoked(true);
                refreshTokenRepository.save(t);
            });
        } catch (Exception e) {
            log.debug("Logout avec refresh token invalide ignore");
        }
    }

    private AuthResult issueTokens(User user) {
        String access = jwtService.generateAccessToken(user);
        String refresh = jwtService.generateRefreshToken(user);
        Instant refreshExp = jwtService.getExpiration(refresh);
        RefreshToken rt = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(sha256(refresh))
                .expiresAt(refreshExp)
                .revoked(false)
                .createdAt(Instant.now())
                .build();
        refreshTokenRepository.save(rt);

        long accessTtl = Duration.between(Instant.now(), jwtService.getExpiration(access)).toSeconds();
        LoginResponse body = new LoginResponse(access, accessTtl, UserDto.from(user));
        return new AuthResult(body, refresh, Duration.between(Instant.now(), refreshExp).toSeconds());
    }

    private static String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }

    public long accessTokenTtlSeconds() {
        return Duration.ofMinutes(jwtProperties.getAccessTokenTtlMinutes()).toSeconds();
    }
}
