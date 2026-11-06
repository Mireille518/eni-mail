package mg.eni.email.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.eni.email.config.AttachmentProperties;
import mg.eni.email.document.Attachment;
import mg.eni.email.document.Message;
import mg.eni.email.document.User;
import mg.eni.email.enums.Role;
import mg.eni.email.exception.BusinessException;
import mg.eni.email.exception.ForbiddenException;
import mg.eni.email.exception.ResourceNotFoundException;
import mg.eni.email.repository.AttachmentRepository;
import mg.eni.email.repository.MessageRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final MessageRepository messageRepository;
    private final AttachmentProperties props;

    private Path storageRoot;

    @PostConstruct
    void init() throws IOException {
        this.storageRoot = Path.of(props.getStoragePath()).toAbsolutePath().normalize();
        Files.createDirectories(storageRoot);
        log.info("Stockage pieces jointes : {}", storageRoot);
    }

    public Attachment upload(MultipartFile file, User owner) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "FILE_EMPTY", "Fichier vide");
        }
        if (file.getSize() > props.getMaxFileSizeBytes()) {
            throw new BusinessException(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Fichier trop volumineux");
        }
        String contentType = file.getContentType();
        if (contentType == null || !props.getAllowedContentTypes().contains(contentType)) {
            throw new BusinessException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "MIME_NOT_ALLOWED",
                    "Type de fichier non autorise : " + contentType);
        }
        String cleanOriginal = StringUtils.cleanPath(
                file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename());
        if (cleanOriginal.contains("..") || cleanOriginal.contains("/") || cleanOriginal.contains("\\")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_FILENAME", "Nom de fichier invalide");
        }

        String extension = "";
        int dot = cleanOriginal.lastIndexOf('.');
        if (dot > 0 && dot < cleanOriginal.length() - 1) {
            extension = cleanOriginal.substring(dot).toLowerCase();
        }
        String stored = UUID.randomUUID() + extension;
        Path dest = storageRoot.resolve(stored).normalize();
        if (!dest.startsWith(storageRoot)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_PATH", "Chemin invalide");
        }
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
        }

        Attachment a = Attachment.builder()
                .ownerId(owner.getId())
                .filename(cleanOriginal)
                .storedName(stored)
                .contentType(contentType)
                .size(file.getSize())
                .createdAt(Instant.now())
                .build();
        return attachmentRepository.save(a);
    }

    public record DownloadResource(Resource resource, String filename, String contentType, long size) { }

    public DownloadResource download(String attachmentId, User currentUser) throws IOException {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("ATTACHMENT_NOT_FOUND", "Piece jointe introuvable"));
        assertDownloadAccess(a, currentUser);
        Path path = storageRoot.resolve(a.getStoredName()).normalize();
        if (!path.startsWith(storageRoot) || !Files.exists(path)) {
            throw new ResourceNotFoundException("ATTACHMENT_FILE_MISSING", "Fichier introuvable sur le disque");
        }
        return new DownloadResource(new UrlResource(path.toUri()), a.getFilename(), a.getContentType(), a.getSize());
    }

    public void deleteOwn(String attachmentId, User currentUser) throws IOException {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("ATTACHMENT_NOT_FOUND", "Piece jointe introuvable"));
        if (!a.getOwnerId().equals(currentUser.getId()) && currentUser.getRole() != Role.ROLE_ADMIN) {
            throw new ForbiddenException("ATTACHMENT_FORBIDDEN", "Supression non autorisee");
        }
        if (a.getMessageId() != null) {
            Message m = messageRepository.findById(a.getMessageId()).orElse(null);
            if (m != null && !m.isDraft()) {
                throw new BusinessException(HttpStatus.CONFLICT, "ATTACHMENT_LOCKED",
                        "Impossible de supprimer une piece jointe d'un message envoye");
            }
        }
        Path path = storageRoot.resolve(a.getStoredName()).normalize();
        if (path.startsWith(storageRoot)) {
            Files.deleteIfExists(path);
        }
        attachmentRepository.delete(a);
    }

    private void assertDownloadAccess(Attachment a, User user) {
        if (user.getRole() == Role.ROLE_ADMIN) return;
        if (a.getOwnerId().equals(user.getId())) return;
        if (a.getMessageId() == null) {
            throw new ForbiddenException("ATTACHMENT_FORBIDDEN", "Acces non autorise");
        }
        Message m = messageRepository.findById(a.getMessageId())
                .orElseThrow(() -> new ResourceNotFoundException("MESSAGE_NOT_FOUND", "Message introuvable"));
        boolean recipient = m.getRecipients() != null
                && m.getRecipients().stream().anyMatch(r -> r.getUserId().equals(user.getId()));
        if (!recipient && !m.getSenderId().equals(user.getId())) {
            throw new ForbiddenException("ATTACHMENT_FORBIDDEN", "Acces non autorise");
        }
    }

}
