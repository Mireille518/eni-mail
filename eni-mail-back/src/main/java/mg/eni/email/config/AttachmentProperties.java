package mg.eni.email.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.attachments")
public class AttachmentProperties {
    private String storagePath = "./data/uploads";
    private long maxFileSizeBytes = 5L * 1024 * 1024;
    private List<String> allowedContentTypes = new ArrayList<>();
}
