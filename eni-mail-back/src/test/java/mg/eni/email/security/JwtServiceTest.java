package mg.eni.email.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.jsonwebtoken.JwtException;
import mg.eni.email.config.JwtProperties;
import mg.eni.email.document.User;
import mg.eni.email.enums.AccountStatus;
import mg.eni.email.enums.Role;

class JwtServiceTest {

    private JwtService jwt;
    private User user;

    @BeforeEach
    void setup() {
        JwtProperties props = new JwtProperties();
        props.setSecret("super-secret-at-least-32-bytes-long-for-hs256!!");
        props.setAccessTokenTtlMinutes(15);
        props.setRefreshTokenTtlDays(7);
        props.setIssuer("eni-mail-test");
        jwt = new JwtService(props);
        user = User.builder()
                .id("u1")
                .email("u@example.org")
                .passwordHash("x")
                .firstName("U")
                .lastName("One")
                .role(Role.ROLE_ETUDIANT)
                .status(AccountStatus.ACTIVE)
                .build();
    }

    @Test
    void access_token_contains_user_claims() {
        String t = jwt.generateAccessToken(user);
        var claims = jwt.parseOfType(t, JwtService.TokenType.ACCESS);
        assertThat(claims.getSubject()).isEqualTo("u1");
        assertThat(claims.get("email")).isEqualTo("u@example.org");
        assertThat(claims.get("role")).isEqualTo("ROLE_ETUDIANT");
        assertThat(claims.getIssuer()).isEqualTo("eni-mail-test");
    }

    @Test
    void refresh_token_cannot_be_used_as_access() {
        String refresh = jwt.generateRefreshToken(user);
        assertThatThrownBy(() -> jwt.parseOfType(refresh, JwtService.TokenType.ACCESS))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void access_token_cannot_be_used_as_refresh() {
        String access = jwt.generateAccessToken(user);
        assertThatThrownBy(() -> jwt.parseOfType(access, JwtService.TokenType.REFRESH))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void secret_too_short_rejected_at_startup() {
        JwtProperties props = new JwtProperties();
        props.setSecret("too-short");
        assertThatThrownBy(() -> new JwtService(props))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 octets");
    }

    @Test
    void tampered_token_is_rejected() {
        String t = jwt.generateAccessToken(user);
        String tampered = t.substring(0, t.length() - 2) + "AA";
        assertThatThrownBy(() -> jwt.parse(tampered))
                .isInstanceOf(JwtException.class);
    }
}
