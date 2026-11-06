package mg.eni.email.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import mg.eni.email.document.Attachment;

@Repository
public interface AttachmentRepository extends MongoRepository<Attachment, String> {
    List<Attachment> findByIdIn(List<String> ids);
    List<Attachment> findByMessageId(String messageId);
    List<Attachment> findByOwnerIdAndMessageIdIsNull(String ownerId);
}
