from fastapi import FastAPI, HTTPException, Header, Request
from fastapi import Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Set, Tuple
from datetime import datetime
import re
import json
import os
from pathlib import Path

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from google.oauth2 import service_account
try:
    from google.cloud import firestore  # type: ignore
except Exception:  # pragma: no cover
    firestore = None  # type: ignore
from starlette.middleware.gzip import GZipMiddleware


app = FastAPI(title="Blog API (Python)", version="0.1.0")

# CORS origins: from env CORS_ORIGINS (comma-separated), fallback to local dev
origins_env = (os.getenv("CORS_ORIGINS") or "").strip()
origins = [o.strip() for o in origins_env.split(",") if o.strip()] or [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# GZip for faster payload delivery
app.add_middleware(GZipMiddleware, minimum_size=500)


# Firestore client (lazy)
def _load_firestore_client():
    if firestore is None:
        return None

    def client_from_json(json_text: str):
        try:
            info = json.loads(json_text)
            creds = service_account.Credentials.from_service_account_info(info)
            project_id = info.get("project_id")
            return firestore.Client(project=project_id, credentials=creds)
        except Exception:
            return None

    # 1) Preferred: env var with full JSON
    json_str = (os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON") or "").strip()
    client = client_from_json(json_str) if json_str else None

    # 2) Alternative: env var with a file path
    if client is None:
        json_path = (os.getenv("FIREBASE_SERVICE_ACCOUNT_FILE") or "").strip()
        if json_path:
            try:
                json_str = Path(json_path).read_text(encoding="utf-8").strip()
                client = client_from_json(json_str)
            except Exception:
                client = None

    # 3) Render Secret Files default mount: /etc/secrets/<filename>
    if client is None:
        try:
            secrets_dir = Path("/etc/secrets")
            if secrets_dir.exists():
                candidates = list(secrets_dir.glob("*.json")) or list(secrets_dir.iterdir())
                for p in candidates:
                    if not p.is_file():
                        continue
                    try:
                        json_str = p.read_text(encoding="utf-8").strip()
                        client = client_from_json(json_str)
                        if client is not None:
                            break
                    except Exception:
                        continue
        except Exception:
            client = None

    return client


_fs_client = None  # type: ignore


def fs_client():
    global _fs_client
    if _fs_client is None:
        _fs_client = _load_firestore_client()
    return _fs_client


def using_firestore() -> bool:
    return fs_client() is not None


@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    response = await call_next(request)
    # Cache only safe GETs for list/search/article fetches (short TTL for MVP)
    path = request.url.path
    if request.method == "GET" and (
        path.startswith("/api/v1/articles") or path.startswith("/api/v1/search")
    ):
        # Avoid caching for user-specific endpoints
        if "/likes" not in path and "/bookmark" not in path and "/comments" not in path and "/users/" not in path:
            response.headers.setdefault("Cache-Control", "public, max-age=30, stale-while-revalidate=60")
    return response


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


# Test categories for MVP
CATEGORIES: List[str] = ["Технологии", "Дизайн", "Бизнес"]


def compute_reading_time_minutes(text: str) -> int:
    # Approximate: 180 words per minute
    try:
        words = len(re.findall(r"\w+", text or ""))
    except Exception:
        words = 0
    minutes = max(1, round(words / 180))
    return minutes


class ArticleCreate(BaseModel):
    title: Optional[str] = "Untitled"
    subtitle: Optional[str] = ""
    content: Optional[str] = ""
    is_published: Optional[bool] = True
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    reading_time_minutes: Optional[int] = None


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    reading_time_minutes: Optional[int] = None


class CommentCreate(BaseModel):
    text: str
    author: Optional[str] = None


# In-memory stores (fallback if Firestore is not configured)
articles_by_slug: Dict[str, Dict[str, Any]] = {}
comments_by_slug: Dict[str, List[Dict[str, Any]]] = {}
likes_by_slug: Dict[str, Set[str]] = {}
bookmarks_by_slug: Dict[str, Set[str]] = {}
subscriptions_by_author: Dict[str, Set[str]] = {}


def slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s or "untitled"


def ensure_seed():
    if using_firestore():
        client = fs_client()
        assert client is not None
        # Seed only if no articles exist
        try:
            docs = list(client.collection("articles").limit(1).stream())
            if docs:
                return
        except Exception:
            # If Firestore failed, skip seeding to avoid blocking API
            return
        slug = "welcome"
        article = {
            "slug": slug,
            "title": "Добро пожаловать",
            "subtitle": "Стартовая статья для проверки UI",
            "content": "# Привет!\n\nЭто демо-статья. Вы можете отредактировать или удалить её.",
            "is_published": True,
            "likes": 0,
            "views": 0,
            "created_at": now_iso(),
            "created_by": "system",
            "created_by_name": "System",
            "created_by_email": "",
            "created_by_photo": "",
            "tags": [],
            "category": CATEGORIES[0],
            "reading_time_minutes": compute_reading_time_minutes("# Привет!\n\nЭто демо-статья. Вы можете отредактировать или удалить её."),
        }
        client.collection("articles").document(slug).set(article)
        return

    if not articles_by_slug:
        slug = "welcome"
        articles_by_slug[slug] = {
            "slug": slug,
            "title": "Добро пожаловать",
            "subtitle": "Стартовая статья для проверки UI",
            "content": "# Привет!\n\nЭто демо-статья. Вы можете отредактировать или удалить её.",
            "is_published": True,
            "likes": 0,
            "views": 0,
            "created_at": now_iso(),
            "created_by": "system",
            "created_by_name": "System",
            "created_by_email": "",
            "created_by_photo": "",
            "tags": [],
            "category": CATEGORIES[0],
            "reading_time_minutes": compute_reading_time_minutes("# Привет!\n\nЭто демо-статья. Вы можете отредактировать или удалить её."),
        }
        comments_by_slug[slug] = []
        likes_by_slug[slug] = set()
        bookmarks_by_slug[slug] = set()
        subscriptions_by_author.setdefault("system", set())


@app.get("/api/v1/health")
def health_root():
    return {"status": "ok"}


@app.get("/api/v1/articles/health")
def health_articles():
    return {"status": "ok"}


@app.get("/api/v1/articles")
def list_articles():
    ensure_seed()
    if using_firestore():
        client = fs_client()
        assert client is not None
        items: List[Dict[str, Any]] = []
        for d in client.collection("articles").order_by("created_at", direction=firestore.Query.DESCENDING).stream():
            data = d.to_dict() or {}
            slug = data.get("slug", d.id)
            # comments_count: count subcollection (MVP: simple len)
            try:
                comments = list(client.collection("articles").document(slug).collection("comments").stream())
                data["comments_count"] = len(comments)
            except Exception:
                data["comments_count"] = 0
            items.append(data)
        return items

    base_items = list(articles_by_slug.values())
    base_items.sort(key=lambda a: a.get("created_at", ""), reverse=True)
    enriched = []
    for a in base_items:
        slug = a.get("slug", "")
        c = len(comments_by_slug.get(slug, []))
        item = dict(a)
        item["comments_count"] = c
        enriched.append(item)
    return enriched


@app.get("/api/v1/search")
def search_articles(q: str = Query(default="")):
    ensure_seed()
    query = (q or "").strip().lower()
    if not query:
        return []
    if using_firestore():
        client = fs_client()
        assert client is not None
        # Firestore не поддерживает полнотекстовый поиск по contains — читаем список и фильтруем в памяти (MVP)
        items = []
        for d in client.collection("articles").order_by("created_at", direction=firestore.Query.DESCENDING).stream():
            data = d.to_dict() or {}
            hay = "\n".join([str(data.get("title", "")), str(data.get("subtitle", "")), str(data.get("content", ""))]).lower()
            if query in hay:
                slug = data.get("slug", d.id)
                try:
                    comments = list(client.collection("articles").document(slug).collection("comments").stream())
                    data["comments_count"] = len(comments)
                except Exception:
                    data["comments_count"] = 0
                items.append(data)
        return items

    def matches(a: Dict[str, Any]) -> bool:
        return any(
            query in str(a.get(field, "")).lower()
            for field in ("title", "subtitle", "content")
        )
    items = [a for a in articles_by_slug.values() if matches(a)]
    items.sort(key=lambda a: a.get("created_at", ""), reverse=True)
    enriched = []
    for a in items:
        slug = a.get("slug", "")
        c = len(comments_by_slug.get(slug, []))
        item = dict(a)
        item["comments_count"] = c
        enriched.append(item)
    return enriched


@app.post("/api/v1/articles", status_code=201)
def create_article(body: ArticleCreate, authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    user = _verify_user(authorization)
    uid = (user.get("user_id") or user.get("uid") or "").strip()
    author_name = (user.get("name") or user.get("email") or "").strip()
    author_email = (user.get("email") or "").strip()
    author_photo = (user.get("picture") or "").strip()
    title = (body.title or "Untitled").strip() or "Untitled"
    base = slugify(title)
    # compute reading time
    provided_minutes = None
    try:
        if body.reading_time_minutes is not None:
            provided_minutes = int(body.reading_time_minutes)
    except Exception:
        provided_minutes = None
    reading_minutes = provided_minutes if (provided_minutes is not None and provided_minutes > 0) else compute_reading_time_minutes(body.content or "")

    if using_firestore():
        client = fs_client()
        assert client is not None
        slug = base
        idx = 1
        while client.collection("articles").document(slug).get().exists:
            idx += 1
            slug = f"{base}-{idx}"
        article = {
            "slug": slug,
            "title": title,
            "subtitle": (body.subtitle or ""),
            "content": (body.content or ""),
            "is_published": True if body.is_published is None else bool(body.is_published),
            "created_at": now_iso(),
            "likes": 0,
            "views": 0,
            "created_by": uid or "",
            "created_by_name": author_name,
            "created_by_email": author_email,
            "created_by_photo": author_photo,
            "tags": list(body.tags or []),
            "category": (body.category or CATEGORIES[0]),
            "reading_time_minutes": reading_minutes,
        }
        client.collection("articles").document(slug).set(article)
        return article

    slug = base
    idx = 1
    while slug in articles_by_slug:
        idx += 1
        slug = f"{base}-{idx}"
    article = {
        "slug": slug,
        "title": title,
        "subtitle": (body.subtitle or ""),
        "content": (body.content or ""),
        "is_published": True if body.is_published is None else bool(body.is_published),
        "created_at": now_iso(),
        "likes": 0,
        "views": 0,
        "created_by": uid or "",
        "created_by_name": author_name,
        "created_by_email": author_email,
        "created_by_photo": author_photo,
        "tags": list(body.tags or []),
        "category": (body.category or CATEGORIES[0]),
        "reading_time_minutes": reading_minutes,
    }
    articles_by_slug[slug] = article
    comments_by_slug.setdefault(slug, [])
    likes_by_slug.setdefault(slug, set())
    bookmarks_by_slug.setdefault(slug, set())
    return article


@app.get("/api/v1/articles/{slug}")
def get_article(slug: str):
    ensure_seed()
    if using_firestore():
        client = fs_client()
        assert client is not None
        ref = client.collection("articles").document(slug)
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404)
        # increment views atomically
        try:
            ref.update({"views": firestore.Increment(1)})
        except Exception:
            pass
        data = doc.to_dict() or {}
        data["views"] = int(data.get("views", 0)) + 1
        return data

    a = articles_by_slug.get(slug)
    if not a:
        raise HTTPException(status_code=404)
    a["views"] = int(a.get("views", 0)) + 1
    articles_by_slug[slug] = a
    return a


@app.put("/api/v1/articles/{slug}")
def update_article(slug: str, body: ArticleUpdate, authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    user = _verify_user(authorization)
    uid = (user.get("user_id") or user.get("uid") or "").strip()

    if using_firestore():
        client = fs_client()
        assert client is not None
        ref = client.collection("articles").document(slug)
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404)
        a = doc.to_dict() or {}
        owner = (a.get("created_by") or "").strip()
        if owner and uid and uid != owner:
            raise HTTPException(status_code=403, detail={"error": "forbidden"})
        update: Dict[str, Any] = {}
        if body.title is not None:
            t = (body.title or "").strip()
            update["title"] = t or a.get("title", "Untitled")
        if body.subtitle is not None:
            update["subtitle"] = body.subtitle or ""
        content_changed = False
        if body.content is not None:
            update["content"] = body.content or ""
            content_changed = True
        if body.is_published is not None:
            update["is_published"] = bool(body.is_published)
        if body.tags is not None:
            update["tags"] = list(body.tags or [])
        if body.category is not None:
            update["category"] = body.category or CATEGORIES[0]
        # reading time logic
        if body.reading_time_minutes is not None:
            try:
                provided = int(body.reading_time_minutes)
            except Exception:
                provided = 0
            if provided > 0:
                update["reading_time_minutes"] = provided
            else:
                update["reading_time_minutes"] = compute_reading_time_minutes(update.get("content", a.get("content") or ""))
        else:
            current = a.get("reading_time_minutes")
            if (current in (None, 0)):
                update["reading_time_minutes"] = compute_reading_time_minutes(update.get("content", a.get("content") or ""))
            else:
                # keep existing
                pass
        update["updated_at"] = now_iso()
        ref.update(update)
        new_doc = ref.get()
        return new_doc.to_dict()

    a = articles_by_slug.get(slug)
    if not a:
        raise HTTPException(status_code=404)
    owner = (a.get("created_by") or "").strip()
    if owner and uid and uid != owner:
        raise HTTPException(status_code=403, detail={"error": "forbidden"})
    if body.title is not None:
        t = (body.title or "").strip()
        a["title"] = t or a.get("title", "Untitled")
    if body.subtitle is not None:
        a["subtitle"] = body.subtitle or ""
    content_changed = False
    if body.content is not None:
        a["content"] = body.content or ""
        content_changed = True
    if body.is_published is not None:
        a["is_published"] = bool(body.is_published)
    if body.tags is not None:
        a["tags"] = list(body.tags or [])
    if body.category is not None:
        a["category"] = body.category or CATEGORIES[0]
    if body.reading_time_minutes is not None:
        try:
            provided = int(body.reading_time_minutes)
        except Exception:
            provided = 0
        if provided > 0:
            a["reading_time_minutes"] = provided
        else:
            a["reading_time_minutes"] = compute_reading_time_minutes(a.get("content") or "")
    else:
        if ("reading_time_minutes" not in a) or (a.get("reading_time_minutes") in (None, 0)):
            a["reading_time_minutes"] = compute_reading_time_minutes(a.get("content") or "")
    a["updated_at"] = now_iso()
    articles_by_slug[slug] = a
    return a


@app.delete("/api/v1/articles/{slug}", status_code=204)
def delete_article(slug: str, authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    user = _verify_user(authorization)
    uid = (user.get("user_id") or user.get("uid") or "").strip()
    if using_firestore():
        client = fs_client()
        assert client is not None
        ref = client.collection("articles").document(slug)
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404)
        a = doc.to_dict() or {}
        owner = (a.get("created_by") or "").strip()
        if owner and uid and uid != owner:
            raise HTTPException(status_code=403, detail={"error": "forbidden"})
        ref.delete()
        return

    if slug not in articles_by_slug:
        raise HTTPException(status_code=404)
    a = articles_by_slug.get(slug, {})
    owner = (a.get("created_by") or "").strip()
    if owner and uid and uid != owner:
        raise HTTPException(status_code=403, detail={"error": "forbidden"})
    del articles_by_slug[slug]
    comments_by_slug.pop(slug, None)
    likes_by_slug.pop(slug, None)
    return


@app.get("/api/v1/articles/{slug}/comments")
def list_comments(slug: str):
    ensure_seed()
    if using_firestore():
        client = fs_client()
        assert client is not None
        if not client.collection("articles").document(slug).get().exists:
            raise HTTPException(status_code=404)
        comments = [d.to_dict() or {} for d in client.collection("articles").document(slug).collection("comments").order_by("created_at", direction=firestore.Query.DESCENDING).stream()]
        return comments
    if slug not in articles_by_slug:
        raise HTTPException(status_code=404)
    return comments_by_slug.get(slug, [])


def _verify_user(authorization: Optional[str]) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail={"error": "missing bearer token"})
    token = authorization.split(" ", 1)[1].strip()
    try:
        request = google_requests.Request()
        # Verify Firebase ID token. Do not force audience; library validates issuer and signature.
        claims = google_id_token.verify_firebase_token(token, request)
        if not claims:
            raise ValueError("invalid claims")
        return claims
    except Exception:
        raise HTTPException(status_code=401, detail={"error": "invalid token"})


@app.post("/api/v1/articles/{slug}/comments", status_code=201)
def add_comment(slug: str, body: CommentCreate, authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    user = _verify_user(authorization)
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail={"error": "text is required"})
    author = (body.author or user.get("name") or user.get("email") or "User").strip()
    c = {
        "id": datetime.utcnow().timestamp().__repr__().replace(".", ""),
        "text": text,
        "author": author,
        "created_at": now_iso(),
    }
    if using_firestore():
        client = fs_client()
        assert client is not None
        if not client.collection("articles").document(slug).get().exists:
            raise HTTPException(status_code=404)
        client.collection("articles").document(slug).collection("comments").document(c["id"]).set(c)
        return c
    if slug not in articles_by_slug:
        raise HTTPException(status_code=404)
    comments_by_slug.setdefault(slug, [])
    comments_by_slug[slug].insert(0, c)
    return c


@app.get("/api/v1/articles/{slug}/likes")
def get_likes(slug: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"), authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    if using_firestore():
        client = fs_client()
        assert client is not None
        ref = client.collection("articles").document(slug)
        if not ref.get().exists:
            raise HTTPException(status_code=404)
        liked = False
        uid: Optional[str] = None
        if authorization:
            try:
                claims = _verify_user(authorization)
                uid = (claims.get("user_id") or claims.get("uid"))  # type: ignore
            except HTTPException:
                uid = None
        elif x_user_id:
            uid = x_user_id
        if uid:
            liked = ref.collection("likes").document(str(uid)).get().exists
        # likes count — читаем поле или считаем количество документов (если поля нет)
        doc = ref.get()
        data = doc.to_dict() or {}
        likes_count = int(data.get("likes", 0))
        if likes_count == 0:
            try:
                likes_count = len(list(ref.collection("likes").stream()))
            except Exception:
                likes_count = 0
        return {"likes": likes_count, "liked": liked}

    if slug not in articles_by_slug:
        raise HTTPException(status_code=404)
    likes_set = likes_by_slug.get(slug, set())
    liked = False
    if authorization:
        try:
            claims = _verify_user(authorization)
            uid = claims.get("user_id") or claims.get("uid")
            liked = bool(uid and uid in likes_set)
        except HTTPException:
            liked = False
    elif x_user_id:
        liked = x_user_id in likes_set
    return {"likes": len(likes_set), "liked": liked}


@app.post("/api/v1/articles/{slug}/likes")
def toggle_like(slug: str, authorization: Optional[str] = Header(default=None), body: Optional[Dict[str, Any]] = None):
    ensure_seed()
    claims = _verify_user(authorization)
    user_id = (claims.get("user_id") or claims.get("uid") or "").strip()
    if not user_id:
        raise HTTPException(status_code=401, detail={"error": "user_id required"})
    if using_firestore():
        client = fs_client()
        assert client is not None
        ref = client.collection("articles").document(slug)
        if not ref.get().exists:
            raise HTTPException(status_code=404)
        like_ref = ref.collection("likes").document(user_id)
        if like_ref.get().exists:
            like_ref.delete()
            liked = False
            try:
                ref.update({"likes": firestore.Increment(-1)})
            except Exception:
                pass
        else:
            like_ref.set({"uid": user_id, "at": now_iso()})
            liked = True
            try:
                ref.update({"likes": firestore.Increment(1)})
            except Exception:
                pass
        doc = ref.get()
        data = doc.to_dict() or {}
        likes_count = int(data.get("likes", 0))
        return {"likes": likes_count, "liked": liked}

    if slug not in articles_by_slug:
        raise HTTPException(status_code=404)
    likes_set = likes_by_slug.setdefault(slug, set())
    if user_id in likes_set:
        likes_set.remove(user_id)
        liked = False
    else:
        likes_set.add(user_id)
        liked = True
    articles_by_slug[slug]["likes"] = len(likes_set)
    return {"likes": len(likes_set), "liked": liked}


@app.get("/api/v1/articles/{slug}/bookmark")
def get_bookmark(slug: str, authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    if using_firestore():
        client = fs_client()
        assert client is not None
        ref = client.collection("articles").document(slug)
        if not ref.get().exists:
            raise HTTPException(status_code=404)
        bookmarked = False
        try:
            claims = _verify_user(authorization)
            uid = (claims.get("user_id") or claims.get("uid") or "").strip()
            if uid:
                bookmarked = ref.collection("bookmarks").document(uid).get().exists
        except HTTPException:
            bookmarked = False
        return {"bookmarked": bookmarked}

    if slug not in articles_by_slug:
        raise HTTPException(status_code=404)
    bookmarked = False
    try:
        claims = _verify_user(authorization)
        uid = (claims.get("user_id") or claims.get("uid") or "").strip()
        if uid:
            bookmarked = uid in bookmarks_by_slug.setdefault(slug, set())
    except HTTPException:
        bookmarked = False
    return {"bookmarked": bookmarked}


# Subscriptions (follow authors)
@app.get("/api/v1/authors/{author_id}/subscription")
def get_subscription(author_id: str, authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    if using_firestore():
        client = fs_client()
        assert client is not None
        users_ref = client.collection("authors").document(author_id).collection("subscriptions")
        subscribed = False
        try:
            claims = _verify_user(authorization)
            uid = (claims.get("user_id") or claims.get("uid") or "").strip()
            if uid:
                subscribed = users_ref.document(uid).get().exists
        except HTTPException:
            subscribed = False
        try:
            count = len(list(users_ref.stream()))
        except Exception:
            count = 0
        return {"subscribed": subscribed, "count": count}

    try:
        claims = _verify_user(authorization)
        uid = (claims.get("user_id") or claims.get("uid") or "").strip()
        subscribed = bool(uid and uid in subscriptions_by_author.setdefault(author_id, set()))
    except HTTPException:
        subscribed = False
    count = len(subscriptions_by_author.setdefault(author_id, set()))
    return {"subscribed": subscribed, "count": count}


@app.post("/api/v1/authors/{author_id}/subscription")
def toggle_subscription(author_id: str, authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    claims = _verify_user(authorization)
    uid = (claims.get("user_id") or claims.get("uid") or "").strip()
    if not uid:
        raise HTTPException(status_code=401, detail={"error": "user_id required"})
    if using_firestore():
        client = fs_client()
        assert client is not None
        users_ref = client.collection("authors").document(author_id).collection("subscriptions")
        user_ref = users_ref.document(uid)
        if user_ref.get().exists:
            user_ref.delete()
            subscribed = False
        else:
            user_ref.set({"uid": uid, "at": now_iso()})
            subscribed = True
        try:
            count = len(list(users_ref.stream()))
        except Exception:
            count = 0
        return {"subscribed": subscribed, "count": count}

    s = subscriptions_by_author.setdefault(author_id, set())
    if uid in s:
        s.remove(uid)
        subscribed = False
    else:
        s.add(uid)
        subscribed = True
    return {"subscribed": subscribed, "count": len(s)}


@app.get("/api/v1/users/me/subscriptions")
def list_my_subscriptions(authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    claims = _verify_user(authorization)
    uid = (claims.get("user_id") or claims.get("uid") or "").strip()
    if not uid:
        raise HTTPException(status_code=401, detail={"error": "user_id required"})
    if using_firestore():
        client = fs_client()
        assert client is not None
        refs = client.collection("users").document(uid).collection("subscriptions").stream()
        authors = [d.id for d in refs]
        return {"authors": authors}
    authors: List[str] = []
    for author, users in subscriptions_by_author.items():
        if uid in users:
            authors.append(author)
    return {"authors": authors}


@app.post("/api/v1/articles/{slug}/bookmark")
def toggle_bookmark(slug: str, authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    claims = _verify_user(authorization)
    uid = (claims.get("user_id") or claims.get("uid") or "").strip()
    if not uid:
        raise HTTPException(status_code=401, detail={"error": "user_id required"})
    if using_firestore():
        client = fs_client()
        assert client is not None
        aref = client.collection("articles").document(slug)
        if not aref.get().exists:
            raise HTTPException(status_code=404)
        a_user = aref.collection("bookmarks").document(uid)
        uref = client.collection("users").document(uid).collection("bookmarks").document(slug)
        if a_user.get().exists:
            a_user.delete()
            uref.delete()
            bookmarked = False
        else:
            a_user.set({"uid": uid, "at": now_iso()})
            uref.set({"slug": slug, "at": now_iso()})
            bookmarked = True
        return {"bookmarked": bookmarked}

    if slug not in articles_by_slug:
        raise HTTPException(status_code=404)
    s = bookmarks_by_slug.setdefault(slug, set())
    if uid in s:
        s.remove(uid)
        bookmarked = False
    else:
        s.add(uid)
        bookmarked = True
    return {"bookmarked": bookmarked}


# List current user's bookmarks
@app.get("/api/v1/users/me/bookmarks")
def list_my_bookmarks(authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    claims = _verify_user(authorization)
    uid = (claims.get("user_id") or claims.get("uid") or "").strip()
    if not uid:
        raise HTTPException(status_code=401, detail={"error": "user_id required"})
    if using_firestore():
        client = fs_client()
        assert client is not None
        # Читаем список slug из users/{uid}/bookmarks, затем подтягиваем статьи
        slugs = [d.id for d in client.collection("users").document(uid).collection("bookmarks").stream()]
        items: List[Dict[str, Any]] = []
        for slug in slugs:
            doc = client.collection("articles").document(slug).get()
            if not doc.exists:
                continue
            data = doc.to_dict() or {}
            try:
                c = len(list(client.collection("articles").document(slug).collection("comments").stream()))
            except Exception:
                c = 0
            data["comments_count"] = c
            items.append(data)
        items.sort(key=lambda a: a.get("created_at", ""), reverse=True)
        return items

    result: List[Dict[str, Any]] = []
    for slug, users in bookmarks_by_slug.items():
        if uid in users and slug in articles_by_slug:
            a = articles_by_slug[slug]
            item = dict(a)
            item["comments_count"] = len(comments_by_slug.get(slug, []))
            result.append(item)
    result.sort(key=lambda a: a.get("created_at", ""), reverse=True)
    return result

# List my articles
@app.get("/api/v1/users/me/articles")
def list_my_articles(authorization: Optional[str] = Header(default=None)):
    ensure_seed()
    claims = _verify_user(authorization)
    uid = (claims.get("user_id") or claims.get("uid") or "").strip()
    if not uid:
        raise HTTPException(status_code=401, detail={"error": "user_id required"})
    if using_firestore():
        client = fs_client()
        assert client is not None
        items: List[Dict[str, Any]] = []
        for d in client.collection("articles").where("created_by", "==", uid).order_by("created_at", direction=firestore.Query.DESCENDING).stream():
            data = d.to_dict() or {}
            slug = data.get("slug", d.id)
            try:
                c = len(list(client.collection("articles").document(slug).collection("comments").stream()))
            except Exception:
                c = 0
            data["comments_count"] = c
            items.append(data)
        return items

    base_items = [a for a in articles_by_slug.values() if (a.get("created_by") or "") == uid]
    base_items.sort(key=lambda a: a.get("created_at", ""), reverse=True)
    enriched = []
    for a in base_items:
        slug = a.get("slug", "")
        item = dict(a)
        item["comments_count"] = len(comments_by_slug.get(slug, []))
        enriched.append(item)
    return enriched

# For local dev: uvicorn main:app --host 0.0.0.0 --port 4000


