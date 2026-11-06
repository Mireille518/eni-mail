package mg.eni.email.dto.response;

public record FolderCountsDto(
        long inboxTotal,
        long inboxUnread,
        long sentTotal,
        long drafts,
        long trash
) { }
