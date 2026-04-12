package com.atama.repository;

import com.atama.model.LibraryItem;
import com.atama.model.LibraryItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;
public interface LibraryItemRepository extends JpaRepository<LibraryItem, UUID> {

    @Modifying
    @Query("update LibraryItem li set li.folder = null where li.folder.id = :folderId")
    void clearFolderForItems(@Param("folderId") UUID folderId);

    @Query("""
           select li
           from LibraryItem li
           where li.folder.id = :folderId
           order by li.updatedAt desc
           """)
    List<LibraryItem> findAllByFolderId(@Param("folderId") UUID folderId);

    @Query("""
       select li
       from LibraryItem li
       where li.library.id = :libraryId
       order by li.updatedAt desc
       """)
    List<LibraryItem> findAllByLibraryId(@Param("libraryId") UUID libraryId);

    @Query("""
    select li from LibraryItem li
    where li.library.id = :libraryId
    and li.folder is null
    and li.hidden = false
    order by li.updatedAt desc
    """)
    List<LibraryItem> findLooseItemsByLibraryId(@Param("libraryId") UUID libraryId);
    @Modifying
    @Query("update LibraryItem li set li.folder.id = :folderId where li.id = :itemId")
    void moveToFolder(@Param("itemId") UUID itemId, @Param("folderId") UUID folderId);

    @Query("""
    select li from LibraryItem li
    where lower(li.title) like lower(concat('%', :q, '%'))
    and li.itemType = :type
    and (li.isPublic = true or li.library.user.id = :userId)
    """)
    List<LibraryItem> searchByType(@Param("q") String q, @Param("type") LibraryItemType type, @Param("userId") UUID userId);
}