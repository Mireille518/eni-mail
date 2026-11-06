package mg.eni.email.controller;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mg.eni.email.dto.request.LoginRequest;
import mg.eni.email.dto.response.LoginResponse;
import mg.eni.email.dto.response.UserDto;
import mg.eni.email.security.SecurityUtils;
import mg.eni.email.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    public static final String REFRESH_COOKIE = "eni_refresh";

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        AuthService.AuthResult r = authService.login(req.email(), req.password());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(r.rawRefreshToken(), r.refreshTtlSeconds()).toString())
                .body(r.body());
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@CookieValue(value = REFRESH_COOKIE, required = false) String refresh) {
        AuthService.AuthResult r = authService.refresh(refresh);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(r.rawRefreshToken(), r.refreshTtlSeconds()).toString())
                .body(r.body());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = REFRESH_COOKIE, required = false) String refresh) {
        authService.logout(refresh);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<UserDto> me() {
        return ResponseEntity.ok(UserDto.from(SecurityUtils.requireCurrentUser().getUser()));
    }

    private ResponseCookie buildRefreshCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(false) // true en prod derriere HTTPS
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(0)
                .build();
    }
}
