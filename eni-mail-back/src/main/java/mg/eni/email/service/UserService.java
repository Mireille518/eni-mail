package mg.eni.email.service;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import mg.eni.email.document.User;
import mg.eni.email.dto.request.ChangePasswordRequest;
import mg.eni.email.dto.request.CreateUserRequest;
import mg.eni.email.dto.request.UpdateProfileRequest;
import mg.eni.email.dto.request.UpdateUserRequest;
import mg.eni.email.enums.AccountStatus;
import mg.eni.email.enums.Role;
import mg.eni.email.exception.BusinessException;
import mg.eni.email.exception.ConflictException;
import mg.eni.email.exception.ForbiddenException;
import mg.eni.email.exception.ResourceNotFoundException;
import mg.eni.email.repository.UserRepository;

import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User getById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Utilisateur introuvable"));
    }

    public List<User> getAllByIds(List<String> ids) {
        return userRepository.findByIdIn(ids);
    }

    public Page<User> search(String query, Role role, Pageable pageable) {
        if (StringUtils.hasText(query)) {
            return userRepository.searchByNameOrEmail(query.trim(), pageable);
        }
        if (role != null) {
            return userRepository.findByRole(role, pageable);
        }
        return userRepository.findAll(pageable);
    }

    public User create(CreateUserRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("EMAIL_ALREADY_USED", "Cet email est deja utilise");
        }
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .firstName(req.firstName())
                .lastName(req.lastName())
                .role(req.role())
                .filiere(req.filiere())
                .promotion(req.promotion())
                .status(AccountStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        return userRepository.save(user);
    }

    public User updateAsAdmin(String id, UpdateUserRequest req) {
        User u = getById(id);
        if (StringUtils.hasText(req.firstName())) u.setFirstName(req.firstName());
        if (StringUtils.hasText(req.lastName())) u.setLastName(req.lastName());
        if (req.filiere() != null) u.setFiliere(req.filiere());
        if (req.promotion() != null) u.setPromotion(req.promotion());
        if (req.avatarUrl() != null) u.setAvatarUrl(req.avatarUrl());
        if (req.role() != null) u.setRole(req.role());
        if (req.status() != null) u.setStatus(req.status());
        return userRepository.save(u);
    }

    public User updateProfile(String id, UpdateProfileRequest req) {
        User u = getById(id);
        if (StringUtils.hasText(req.firstName())) u.setFirstName(req.firstName());
        if (StringUtils.hasText(req.lastName())) u.setLastName(req.lastName());
        if (req.filiere() != null) u.setFiliere(req.filiere());
        if (req.promotion() != null) u.setPromotion(req.promotion());
        if (req.avatarUrl() != null) u.setAvatarUrl(req.avatarUrl());
        return userRepository.save(u);
    }

    public void changePassword(String userId, ChangePasswordRequest req) {
        User u = getById(userId);
        if (!passwordEncoder.matches(req.currentPassword(), u.getPasswordHash())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "BAD_CURRENT_PASSWORD", "Mot de passe actuel invalide");
        }
        u.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(u);
    }

    /**
     * Desactivation logique - conserve l'historique des messages.
     */
    public void disable(String id, String actingUserId) {
        if (id.equals(actingUserId)) {
            throw new ForbiddenException("CANNOT_DISABLE_SELF", "Impossible de desactiver son propre compte");
        }
        User u = getById(id);
        u.setStatus(AccountStatus.DISABLED);
        userRepository.save(u);
    }
}
