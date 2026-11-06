package mg.eni.email.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mg.eni.email.document.User;
import mg.eni.email.dto.request.ChangePasswordRequest;
import mg.eni.email.dto.request.CreateUserRequest;
import mg.eni.email.dto.request.UpdateProfileRequest;
import mg.eni.email.dto.request.UpdateUserRequest;
import mg.eni.email.dto.response.PageResponse;
import mg.eni.email.dto.response.UserDto;
import mg.eni.email.enums.Role;
import mg.eni.email.exception.ForbiddenException;
import mg.eni.email.security.SecurityUtils;
import mg.eni.email.service.UserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> me() {
        return ResponseEntity.ok(UserDto.from(SecurityUtils.requireCurrentUser().getUser()));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserDto> updateMe(@Valid @RequestBody UpdateProfileRequest req) {
        String id = SecurityUtils.requireCurrentUserId();
        return ResponseEntity.ok(UserDto.from(userService.updateProfile(id, req)));
    }

    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(SecurityUtils.requireCurrentUserId(), req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<PageResponse<UserDto>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Role role,
            @PageableDefault(size = 20, sort = "lastName", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<User> p = userService.search(q, role, pageable);
        return ResponseEntity.ok(PageResponse.of(p, UserDto::from));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getOne(@PathVariable String id) {
        return ResponseEntity.ok(UserDto.from(userService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserDto> create(@Valid @RequestBody CreateUserRequest req) {
        if (req.role() == Role.ROLE_ADMIN && !SecurityUtils.isAdmin()) {
            throw new ForbiddenException("CANNOT_ASSIGN_ADMIN", "Reserve aux administrateurs");
        }
        return ResponseEntity.status(201).body(UserDto.from(userService.create(req)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserDto> update(@PathVariable String id,
                                          @Valid @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(UserDto.from(userService.updateAsAdmin(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> disable(@PathVariable String id) {
        userService.disable(id, SecurityUtils.requireCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
