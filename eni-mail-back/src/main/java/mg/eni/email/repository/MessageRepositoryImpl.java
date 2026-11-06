package mg.eni.email.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.data.mongodb.core.query.TextQuery;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.mongodb.client.result.UpdateResult;

import lombok.RequiredArgsConstructor;
import mg.eni.email.document.Message;
import mg.eni.email.enums.MessageFolder;

@Repository
@RequiredArgsConstructor
public class MessageRepositoryImpl implements MessageRepositoryCustom {

    private final MongoTemplate mongo;

    @Override
    public boolean markAsRead(String messageId, String userId) {
        Query q = new Query(Criteria.where("_id").is(messageId)
                .and("recipients.userId").is(userId));
        Update u = new Update()
                .set("recipients.$.read", true)
                .set("recipients.$.readAt", Instant.now());
        UpdateResult r = mongo.updateFirst(q, u, Message.class);
        return r.getModifiedCount() > 0;
    }

    @Override
    public boolean markAsUnread(String messageId, String userId) {
        Query q = new Query(Criteria.where("_id").is(messageId)
                .and("recipients.userId").is(userId));
        Update u = new Update()
                .set("recipients.$.read", false)
                .unset("recipients.$.readAt");
        return mongo.updateFirst(q, u, Message.class).getModifiedCount() > 0;
    }

    @Override
    public boolean moveRecipientToTrash(String messageId, String userId) {
        Query q = new Query(Criteria.where("_id").is(messageId)
                .and("recipients.userId").is(userId));
        Update u = new Update()
                .set("recipients.$.folder", MessageFolder.TRASH)
                .set("recipients.$.deleted", true)
                .set("recipients.$.deletedAt", Instant.now());
        return mongo.updateFirst(q, u, Message.class).getModifiedCount() > 0;
    }

    @Override
    public boolean restoreRecipient(String messageId, String userId, MessageFolder target) {
        Query q = new Query(Criteria.where("_id").is(messageId)
                .and("recipients.userId").is(userId));
        Update u = new Update()
                .set("recipients.$.folder", target == null ? MessageFolder.INBOX : target)
                .set("recipients.$.deleted", false)
                .unset("recipients.$.deletedAt");
        return mongo.updateFirst(q, u, Message.class).getModifiedCount() > 0;
    }

    @Override
    public boolean moveSenderToTrash(String messageId) {
        Query q = new Query(Criteria.where("_id").is(messageId));
        Update u = new Update()
                .set("senderFolder", MessageFolder.TRASH)
                .set("senderDeleted", true)
                .set("senderDeletedAt", Instant.now());
        return mongo.updateFirst(q, u, Message.class).getModifiedCount() > 0;
    }

    @Override
    public boolean restoreSender(String messageId, MessageFolder target) {
        Query q = new Query(Criteria.where("_id").is(messageId));
        Update u = new Update()
                .set("senderFolder", target == null ? MessageFolder.SENT : target)
                .set("senderDeleted", false)
                .unset("senderDeletedAt");
        return mongo.updateFirst(q, u, Message.class).getModifiedCount() > 0;
    }

    @Override
    public Page<Message> searchFullText(String queryText, String userId, Pageable pageable) {
        TextCriteria text = TextCriteria.forDefaultLanguage().matching(queryText);
        Criteria access = new Criteria().orOperator(
                Criteria.where("senderId").is(userId),
                Criteria.where("recipients.userId").is(userId)
        );
        Criteria combined = new Criteria().andOperator(
                access,
                Criteria.where("draft").is(false)
        );
        TextQuery q = TextQuery.queryText(text).sortByScore();
        q.addCriteria(combined);
        long total = mongo.count(Query.of(q).limit(-1).skip(-1), Message.class);
        q.with(pageable);
        List<Message> content = mongo.find(q, Message.class);
        return new PageImpl<>(content, pageable, total);
    }
}
