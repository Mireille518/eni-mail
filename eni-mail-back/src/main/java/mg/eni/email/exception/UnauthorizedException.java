package mg.eni.email.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends BusinessException {
    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
    }
}
