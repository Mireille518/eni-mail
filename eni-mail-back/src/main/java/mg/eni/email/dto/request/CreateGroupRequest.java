package mg.eni.email.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateGroupRequest(
        @NotBlank @Size(min = 2, max = 100) String name,
        @Size(max = 500) String description,
        List<String> memberIds
) { }
