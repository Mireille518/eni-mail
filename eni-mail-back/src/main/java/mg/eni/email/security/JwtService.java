package mg.eni.email.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import mg.eni.email.config.JwtProperties;
import mg.eni.email.document.User;

@Service
public class JwtService {

    public enum TokenType { ACCESS, REFRESH }

    private final JwtProperties props;
    private final SecretKey key;

    public JwtService(JwtProperties props) {
        this.props = props;
        byte[] secretBytes = props.getSecret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET doit contenir au moins 32 octets (256 bits). Longueur actuelle : " + secretBytes.length);
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofMinutes(props.getAccessTokenTtlMinutes()));
        return Jwts.builder()
                .issuer(props.getIssuer())
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("typ", TokenType.ACCESS.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(User user) {
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofDays(props.getRefreshTokenTtlDays()));
        return Jwts.builder()
                .issuer(props.getIssuer())
                .subject(user.getId())
                .claim("typ", TokenType.REFRESH.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(props.getIssuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims parseOfType(String token, TokenType expected) {
        Claims c = parse(token);
        Object typ = c.get("typ");
        if (typ == null || !expected.name().equals(typ.toString())) {
            throw new JwtException("Type de token inattendu : " + typ);
        }
        return c;
    }

    public boolean isExpired(ExpiredJwtException e) {
        return e != null;
    }

    public Instant getExpiration(String token) {
        return parse(token).getExpiration().toInstant();
    }

    public long getRefreshTokenTtlSeconds() {
        return Duration.ofDays(props.getRefreshTokenTtlDays()).toSeconds();
    }
}
