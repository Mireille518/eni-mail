package mg.eni.email.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends BusinessException {
    public ConflictException(String code, String message) {
        super(HttpStatus.CONFLICT, code, message);
    }
}
