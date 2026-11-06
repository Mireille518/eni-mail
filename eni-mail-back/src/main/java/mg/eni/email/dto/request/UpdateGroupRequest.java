package mg.eni.email.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateGroupRequest(
        @Size(min = 2, max = 100) String name,
        @Size(max = 500) String description
) { }
