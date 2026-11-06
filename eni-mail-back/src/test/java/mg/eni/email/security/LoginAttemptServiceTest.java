package mg.eni.email.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import mg.eni.email.config.SecurityProperties;

class LoginAttemptServiceTest {

    private LoginAttemptService svc;

    @BeforeEach
    void setup() {
        SecurityProperties props = new SecurityProperties();
        props.setLoginMaxAttempts(3);
        props.setLoginLockoutMinutes(15);
        svc = new LoginAttemptService(props);
    }

    @Test
    void initial_state_is_not_blocked() {
        assertThat(svc.isBlocked("a@a.io")).isFalse();
    }

    @Test
    void failures_below_threshold_do_not_block() {
        svc.onFailure("a@a.io");
        svc.onFailure("a@a.io");
        assertThat(svc.isBlocked("a@a.io")).isFalse();
    }

    @Test
    void threshold_reached_blocks() {
        svc.onFailure("a@a.io");
        svc.onFailure("a@a.io");
        svc.onFailure("a@a.io");
        assertThat(svc.isBlocked("a@a.io")).isTrue();
    }

    @Test
    void success_resets_counter() {
        svc.onFailure("a@a.io");
        svc.onFailure("a@a.io");
        svc.onSuccess("a@a.io");
        svc.onFailure("a@a.io"); // nouveau debut
        assertThat(svc.isBlocked("a@a.io")).isFalse();
    }

    @Test
    void case_insensitive_key() {
        svc.onFailure("A@A.IO");
        svc.onFailure("a@a.io");
        svc.onFailure("A@a.Io");
        assertThat(svc.isBlocked("a@A.io")).isTrue();
    }
}
