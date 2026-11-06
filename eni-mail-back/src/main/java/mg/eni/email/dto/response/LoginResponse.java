package mg.eni.email.dto.response;

public record LoginResponse(
        String accessToken,
        long expiresInSeconds,
        UserDto user
) { }
