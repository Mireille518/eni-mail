package mg.eni.email.exception;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusiness(BusinessException ex, HttpServletRequest req) {
        return build(ex.getStatus(), ex.getCode(), ex.getMessage(), req, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<ApiErrorResponse.FieldViolation> violations = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> new ApiErrorResponse.FieldViolation(f.getField(), f.getDefaultMessage()))
                .toList();
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Validation echouee", req, violations);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraint(ConstraintViolationException ex, HttpServletRequest req) {
        List<ApiErrorResponse.FieldViolation> violations = ex.getConstraintViolations().stream()
                .map(v -> new ApiErrorResponse.FieldViolation(v.getPropertyPath().toString(), v.getMessage()))
                .toList();
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Validation echouee", req, violations);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", "Email ou mot de passe invalide", req, null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuth(AuthenticationException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentification requise", req, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Droits insuffisants", req, null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleUpload(MaxUploadSizeExceededException ex, HttpServletRequest req) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Fichier trop volumineux", req, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethod(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", ex.getMessage(), req, null);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(NoHandlerFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "NOT_FOUND", "Ressource inconnue", req, null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegal(IllegalArgumentException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), req, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleAny(Exception ex, HttpServletRequest req) {
        log.error("Erreur non geree", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Erreur interne du serveur", req, null);
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message,
                                                   HttpServletRequest req,
                                                   List<ApiErrorResponse.FieldViolation> violations) {
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(), status.value(), status.getReasonPhrase(),
                code, message, req.getRequestURI(), violations);
        return ResponseEntity.status(status).body(body);
    }
}
