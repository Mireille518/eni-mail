package mg.eni.email.exception;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        @JsonInclude(JsonInclude.Include.NON_EMPTY) List<FieldViolation> violations
) {
    public record FieldViolation(String field, String message) { }
}
