package mg.eni.email.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import mg.eni.email.config.SecurityProperties;

/**
 * Compteur de tentatives echouees par email. Implementation en memoire -
 * suffisante pour une mono-instance; a remplacer par Redis en multi-instance.
 */
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final SecurityProperties props;
    private final Map<String, Attempt> store = new ConcurrentHashMap<>();

    public void onFailure(String key) {
        store.compute(key.toLowerCase(), (k, v) -> {
            Instant now = Instant.now();
            if (v == null || v.lockedUntil != null && now.isAfter(v.lockedUntil)) {
                return new Attempt(1, null);
            }
            int next = v.count + 1;
            Instant lock = next >= props.getLoginMaxAttempts()
                    ? now.plus(Duration.ofMinutes(props.getLoginLockoutMinutes()))
                    : null;
            return new Attempt(next, lock);
        });
    }

    public void onSuccess(String key) {
        store.remove(key.toLowerCase());
    }

    public boolean isBlocked(String key) {
        Attempt a = store.get(key.toLowerCase());
        if (a == null || a.lockedUntil == null) return false;
        if (Instant.now().isAfter(a.lockedUntil)) {
            store.remove(key.toLowerCase());
            return false;
        }
        return true;
    }

    private record Attempt(int count, Instant lockedUntil) { }
}
