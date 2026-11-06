package mg.eni.email.controller;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import mg.eni.email.document.Attachment;
import mg.eni.email.dto.response.AttachmentDto;
import mg.eni.email.security.SecurityUtils;
import mg.eni.email.service.AttachmentService;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping
    public ResponseEntity<AttachmentDto> upload(@RequestParam("file") MultipartFile file) throws IOException {
        Attachment a = attachmentService.upload(file, SecurityUtils.requireCurrentUser().getUser());
        return ResponseEntity.status(201).body(new AttachmentDto(
                a.getId(), a.getFilename(), a.getContentType(), a.getSize(),
                "/api/attachments/" + a.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable String id) throws IOException {
        AttachmentService.DownloadResource dr = attachmentService.download(id,
                SecurityUtils.requireCurrentUser().getUser());
        String encoded = URLEncoder.encode(dr.filename(), StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(dr.contentType()))
                .contentLength(dr.size())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encoded)
                .body(dr.resource());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws IOException {
        attachmentService.deleteOwn(id, SecurityUtils.requireCurrentUser().getUser());
        return ResponseEntity.noContent().build();
    }
}
