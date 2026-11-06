package mg.eni.email.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import mg.eni.email.document.Message;
import mg.eni.email.enums.MessageFolder;

@Repository
public interface MessageRepository extends MongoRepository<Message, String>, MessageRepositoryCustom {

    @Query("{ 'recipients': { $elemMatch: { 'userId': ?0, 'folder': ?1, 'deleted': false } }, 'draft': false }")
    Page<Message> findForRecipient(String userId, MessageFolder folder, Pageable pageable);

    @Query("{ 'senderId': ?0, 'senderFolder': ?1, 'senderDeleted': false, 'draft': false }")
    Page<Message> findSentForSender(String userId, MessageFolder folder, Pageable pageable);

    @Query("{ 'senderId': ?0, 'draft': true, 'senderDeleted': false }")
    Page<Message> findDraftsBySender(String userId, Pageable pageable);

    @Query("{ 'recipients': { $elemMatch: { 'userId': ?0, 'folder': 'TRASH', 'deleted': true } } }")
    Page<Message> findTrashForRecipient(String userId, Pageable pageable);

    @Query("{ 'senderId': ?0, 'senderFolder': 'TRASH', 'senderDeleted': true }")
    Page<Message> findTrashForSender(String userId, Pageable pageable);

    @Query(value = "{ 'recipients': { $elemMatch: { 'userId': ?0, 'folder': 'INBOX', 'read': false, 'deleted': false } }, 'draft': false }", count = true)
    long countUnreadInInbox(String userId);

    @Query(value = "{ 'recipients': { $elemMatch: { 'userId': ?0, 'folder': ?1, 'deleted': false } }, 'draft': false }", count = true)
    long countForRecipient(String userId, MessageFolder folder);

    @Query(value = "{ 'senderId': ?0, 'senderFolder': ?1, 'senderDeleted': false, 'draft': false }", count = true)
    long countSentForSender(String userId, MessageFolder folder);

    @Query(value = "{ 'senderId': ?0, 'draft': true, 'senderDeleted': false }", count = true)
    long countDraftsBySender(String userId);

    Optional<Message> findByIdAndSenderId(String id, String senderId);
}
