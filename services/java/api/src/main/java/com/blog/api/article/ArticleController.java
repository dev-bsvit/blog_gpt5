package com.blog.api.article;

import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/articles")
@Validated
public class ArticleController {

  private final Map<String, Map<String, Object>> bySlug = new HashMap<>();
  private final Map<String, List<Map<String, Object>>> commentsBySlug = new HashMap<>();
  private final Map<String, Set<String>> likesBySlug = new HashMap<>();

  @PostConstruct
  public void seed() {
    if (bySlug.isEmpty()) {
      Map<String, Object> article = new HashMap<>();
      article.put("slug", "welcome");
      article.put("title", "Добро пожаловать");
      article.put("subtitle", "Стартовая статья для проверки UI");
      article.put("content", "# Привет!\n\nЭто демо-статья. Вы можете отредактировать или удалить её.");
      article.put("is_published", true);
      article.put("likes", 0);
      article.put("created_at", new Date().toInstant().toString());
      bySlug.put("welcome", article);
      commentsBySlug.put("welcome", new ArrayList<>());
      likesBySlug.put("welcome", new HashSet<>());
    }
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("status", "ok");
  }

  @PostMapping
  public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
    String title = Objects.toString(body.getOrDefault("title", "Untitled")).trim();
    if (title.isEmpty()) title = "Untitled";
    String baseSlug = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    String slug = baseSlug;
    int idx = 1;
    while (bySlug.containsKey(slug)) {
      slug = baseSlug + "-" + (++idx);
    }
    Map<String, Object> article = new HashMap<>(body);
    article.put("slug", slug);
    article.putIfAbsent("subtitle", "");
    article.putIfAbsent("is_published", true);
    article.putIfAbsent("created_at", new Date().toInstant().toString());
    article.putIfAbsent("content", "");
    article.putIfAbsent("likes", 0);
    bySlug.put(slug, article);
    return ResponseEntity.status(201).body(article);
  }

  @GetMapping("/{slug}")
  public ResponseEntity<?> get(@PathVariable @NotBlank String slug) {
    Map<String, Object> a = bySlug.get(slug);
    if (a == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(a);
  }

  @GetMapping("/{slug}/comments")
  public ResponseEntity<?> listComments(@PathVariable @NotBlank String slug) {
    if (!bySlug.containsKey(slug)) return ResponseEntity.notFound().build();
    List<Map<String, Object>> list = commentsBySlug.getOrDefault(slug, new ArrayList<>());
    return ResponseEntity.ok(list);
  }

  @PostMapping("/{slug}/comments")
  public ResponseEntity<?> addComment(@PathVariable @NotBlank String slug, @RequestBody Map<String, Object> body) {
    if (!bySlug.containsKey(slug)) return ResponseEntity.notFound().build();
    String text = Objects.toString(body.getOrDefault("text", "")).trim();
    if (text.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "text is required"));
    String author = Objects.toString(body.getOrDefault("author", "Anon")).trim();
    Map<String, Object> c = new HashMap<>();
    c.put("id", UUID.randomUUID().toString());
    c.put("text", text);
    c.put("author", author.isEmpty() ? "Anon" : author);
    c.put("created_at", new Date().toInstant().toString());
    commentsBySlug.computeIfAbsent(slug, k -> new ArrayList<>()).add(0, c);
    return ResponseEntity.status(201).body(c);
  }

  @GetMapping
  public List<Map<String, Object>> list() {
    return bySlug.values().stream()
        .sorted((a, b) -> {
          String s1 = Objects.toString(a.getOrDefault("created_at", ""));
          String s2 = Objects.toString(b.getOrDefault("created_at", ""));
          return s2.compareTo(s1);
        })
        .toList();
  }

  @PutMapping("/{slug}")
  public ResponseEntity<?> update(@PathVariable @NotBlank String slug, @RequestBody Map<String, Object> body) {
    Map<String, Object> existing = bySlug.get(slug);
    if (existing == null) return ResponseEntity.notFound().build();

    if (body.containsKey("title")) {
      String t = Objects.toString(body.get("title"), "").trim();
      existing.put("title", t.isEmpty() ? existing.getOrDefault("title", "Untitled") : t);
    }
    if (body.containsKey("subtitle")) {
      existing.put("subtitle", Objects.toString(body.get("subtitle"), ""));
    }
    if (body.containsKey("content")) {
      existing.put("content", Objects.toString(body.get("content"), ""));
    }
    if (body.containsKey("is_published")) {
      Object v = body.get("is_published");
      boolean pub = v instanceof Boolean ? (Boolean) v : Boolean.parseBoolean(Objects.toString(v));
      existing.put("is_published", pub);
    }
    existing.put("updated_at", new Date().toInstant().toString());
    bySlug.put(slug, existing);
    return ResponseEntity.ok(existing);
  }

  @GetMapping("/{slug}/likes")
  public ResponseEntity<?> getLikes(
      @PathVariable @NotBlank String slug,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    Map<String, Object> a = bySlug.get(slug);
    if (a == null) return ResponseEntity.notFound().build();
    Set<String> set = likesBySlug.getOrDefault(slug, new HashSet<>());
    int likes = set.size();
    boolean liked = (userId != null && set.contains(userId));
    return ResponseEntity.ok(Map.of("likes", likes, "liked", liked));
  }

  @PostMapping("/{slug}/likes")
  public ResponseEntity<?> toggleLike(
      @PathVariable @NotBlank String slug,
      @RequestHeader(name = "X-User-Id", required = false) String userId,
      @RequestBody(required = false) Map<String, Object> body
  ) {
    Map<String, Object> a = bySlug.get(slug);
    if (a == null) return ResponseEntity.notFound().build();
    if (userId == null || userId.isBlank()) {
      // fallback: try body.user_id
      if (body != null) {
        Object v = body.get("user_id");
        if (v != null) userId = Objects.toString(v).trim();
      }
    }
    if (userId == null || userId.isBlank()) {
      return ResponseEntity.status(401).body(Map.of("error", "user_id required"));
    }
    Set<String> set = likesBySlug.computeIfAbsent(slug, k -> new HashSet<>());
    boolean liked;
    if (set.contains(userId)) {
      set.remove(userId);
      liked = false;
    } else {
      set.add(userId);
      liked = true;
    }
    int likes = set.size();
    // keep aggregate for compatibility
    a.put("likes", likes);
    bySlug.put(slug, a);
    return ResponseEntity.ok(Map.of("likes", likes, "liked", liked));
  }

  @DeleteMapping("/{slug}")
  public ResponseEntity<?> delete(@PathVariable @NotBlank String slug) {
    Map<String, Object> removed = bySlug.remove(slug);
    if (removed == null) return ResponseEntity.notFound().build();
    return ResponseEntity.noContent().build();
  }
}
