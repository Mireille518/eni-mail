package mg.eni.email.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends BusinessException {
    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }
    public ForbiddenException(String code, String message) {
        super(HttpStatus.FORBIDDEN, code, message);
    }
}
