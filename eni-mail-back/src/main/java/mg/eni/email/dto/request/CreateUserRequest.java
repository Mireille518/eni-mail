package mg.eni.email.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import mg.eni.email.enums.Role;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotNull Role role,
        String filiere,
        String promotion
) { }
