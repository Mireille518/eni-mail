package mg.eni.email.security;

import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import mg.eni.email.enums.Role;
import mg.eni.email.exception.UnauthorizedException;

public final class SecurityUtils {

    private SecurityUtils() { }

    public static Optional<CurrentUser> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CurrentUser cu)) {
            return Optional.empty();
        }
        return Optional.of(cu);
    }

    public static CurrentUser requireCurrentUser() {
        return getCurrentUser().orElseThrow(() -> new UnauthorizedException("Authentification requise"));
    }

    public static String requireCurrentUserId() {
        return requireCurrentUser().getId();
    }

    public static boolean hasRole(Role role) {
        return getCurrentUser().map(cu -> cu.getUser().getRole() == role).orElse(false);
    }

    public static boolean isAdmin() {
        return hasRole(Role.ROLE_ADMIN);
    }
}
