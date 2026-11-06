package mg.eni.email.dto.request;

import mg.eni.email.enums.AccountStatus;
import mg.eni.email.enums.Role;

public record UpdateUserRequest(
        String firstName,
        String lastName,
        String filiere,
        String promotion,
        String avatarUrl,
        Role role,
        AccountStatus status
) { }
