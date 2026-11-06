package mg.eni.email.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import mg.eni.email.dto.response.AdminStatsDto;
import mg.eni.email.service.AdminStatsService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminStatsService statsService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> stats() {
        return ResponseEntity.ok(statsService.build());
    }
}
