package mg.eni.email.dto.response;

import java.time.Instant;

import mg.eni.email.document.User;
import mg.eni.email.enums.AccountStatus;
import mg.eni.email.enums.Role;

public record UserDto(
        String id,
        String email,
        String firstName,
        String lastName,
        Role role,
        String filiere,
        String promotion,
        String avatarUrl,
        AccountStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserDto from(User u) {
        return new UserDto(
                u.getId(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getRole(),
                u.getFiliere(),
                u.getPromotion(),
                u.getAvatarUrl(),
                u.getStatus(),
                u.getCreatedAt(),
                u.getUpdatedAt()
        );
    }
}
