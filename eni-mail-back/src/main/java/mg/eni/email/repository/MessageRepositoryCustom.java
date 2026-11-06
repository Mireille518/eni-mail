package mg.eni.email.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import mg.eni.email.document.Message;
import mg.eni.email.enums.MessageFolder;

public interface MessageRepositoryCustom {

    boolean markAsRead(String messageId, String userId);

    boolean markAsUnread(String messageId, String userId);

    boolean moveRecipientToTrash(String messageId, String userId);

    boolean restoreRecipient(String messageId, String userId, MessageFolder target);

    boolean moveSenderToTrash(String messageId);

    boolean restoreSender(String messageId, MessageFolder target);

    Page<Message> searchFullText(String query, String userId, Pageable pageable);
}
