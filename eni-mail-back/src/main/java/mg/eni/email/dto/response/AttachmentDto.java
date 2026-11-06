package mg.eni.email.dto.response;

public record AttachmentDto(
        String id,
        String filename,
        String contentType,
        long size,
        String downloadUrl
) { }
