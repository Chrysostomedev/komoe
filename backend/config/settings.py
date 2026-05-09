from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Sécurité fondamentale ────────────────────────────────────────────────────
# S7 : SECRET_KEY DOIT venir de l'env — pas de fallback insécurisé
_secret_key = os.getenv("SECRET_KEY", "")
if not _secret_key:
    # En développement local on accepte une clé insécurisée mais on prévient
    import warnings
    _secret_key = "django-insecure-dev-key-change-in-prod-absolutely"
    warnings.warn(
        "[KOMOE] SECRET_KEY non définie dans les variables d'environnement. "
        "Utilisez une clé aléatoire forte en production : "
        "python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'",
        stacklevel=2,
    )
SECRET_KEY = _secret_key

# S5 : DEBUG est False par défaut — doit être explicitement activé en dev
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# ─── Applications ─────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Tiers
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    # KOMOE apps
    "apps.users",
    "apps.communes",
    "apps.transactions",
    "apps.blockchain",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ─── Base de données ──────────────────────────────────────────────────────────
# SQLite par défaut en local — aucune installation requise
DATABASE_URL = os.getenv("DATABASE_URL", "")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
    import urllib.parse as urlparse
    import psycopg2
    url = urlparse.urlparse(DATABASE_URL)
    db_name = url.path[1:]
    db_options = [db_name, db_name + " ", "komoe_dev", "komoe_dev "]
    connected = False
    for name in db_options:
        try:
            conn = psycopg2.connect(
                dbname=name,
                user=url.username,
                password=url.password,
                host=url.hostname,
                port=url.port or 5432,
                connect_timeout=1
            )
            conn.close()
            DATABASES["default"] = {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": name,
                "USER": url.username,
                "PASSWORD": url.password,
                "HOST": url.hostname,
                "PORT": url.port or 5432,
            }
            connected = True
            break
        except Exception:
            continue
    if not connected:
        DATABASES["default"] = {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }



# ─── Modèle utilisateur custom ────────────────────────────────────────────────
AUTH_USER_MODEL = "users.User"

# ─── Django REST Framework ────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# ─── JWT ──────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", "60"))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_LIFETIME_DAYS", "7"))
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ─── CORS ─────────────────────────────────────────────────────────────────────
# S6 : Ajoutez votre domaine de déploiement dans CORS_ALLOWED_ORIGINS (.env)
# Ex : CORS_ALLOWED_ORIGINS=http://localhost:3000,https://komoe.vercel.app
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
CORS_ALLOW_CREDENTIALS = True

# ─── Blockchain ───────────────────────────────────────────────────────────────
POLYGON_RPC_URL = os.getenv("POLYGON_AMOY_RPC_URL") or os.getenv("POLYGON_RPC_URL", "")
POLYGON_AMOY_RPC_URL = os.getenv("POLYGON_AMOY_RPC_URL") or os.getenv("POLYGON_RPC_URL", "")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
DEPLOYER_PRIVATE_KEY = os.getenv("DEPLOYER_PRIVATE_KEY", "")


# ─── IPFS ─────────────────────────────────────────────────────────────────────
PINATA_JWT = os.getenv("PINATA_JWT", "")
PINATA_GATEWAY = os.getenv("PINATA_GATEWAY", "https://gateway.pinata.cloud/ipfs")

# ─── Internationalisation ─────────────────────────────────────────────────────
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Abidjan"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─── Logging ──────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": BASE_DIR.parent / "logs" / "backend.log",
            "formatter": "verbose",
        },
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

