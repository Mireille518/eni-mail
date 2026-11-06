package mg.eni.email.dto.request;

public record UpdateProfileRequest(
        String firstName,
        String lastName,
        String filiere,
        String promotion,
        String avatarUrl
) { }
