import re
import unicodedata
from urllib.parse import urlsplit

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, URLValidator


validate_office_number = RegexValidator(
    r"\A[0-9]{1,2}\Z", "Use one or two ASCII digits for the office number."
)
validate_office_website = URLValidator(schemes=["http", "https"])

PHONE_PATTERN = re.compile(
    r"\+375[ -]?(?:\((17|25|29|33|44)\)|(17|25|29|33|44))[ -]?"
    r"([0-9]{3})[ -]?([0-9]{2})[ -]?([0-9]{2})"
)
URL_WITH_SCHEME = re.compile(r"^[a-z][a-z0-9+.-]*://", re.IGNORECASE)


def normalize_tower(value):
    return {"a": "A", "b": "B"}.get(value, value)


def normalize_owner(value):
    if any(unicodedata.category(char) in {"Cc", "Zl", "Zp"} for char in value):
        raise ValidationError("Organization names cannot contain control characters or line breaks.")
    return value.strip()


def normalize_phone(value):
    value = value.strip(" ")
    if not value:
        return ""
    match = PHONE_PATTERN.fullmatch(value)
    if not match:
        raise ValidationError("Enter one Belarusian phone number with +375 and a supported area code.")
    parenthesized_code, plain_code, first, second, third = match.groups()
    return f"+375 ({parenthesized_code or plain_code}) {first}-{second}-{third}"


def normalize_website(value):
    value = value.strip()
    if not value:
        return ""
    if any(char.isspace() or unicodedata.category(char) == "Cc" or char == "\\" for char in value):
        raise ValidationError("Enter a single URL without whitespace, control characters or backslashes.")
    if not URL_WITH_SCHEME.match(value):
        value = f"https://{value}"
    try:
        port = urlsplit(value).port
    except ValueError as exc:
        raise ValidationError("Enter a valid URL with a port from 1 to 65535, if specified.") from exc
    if port == 0:
        raise ValidationError("Enter a port from 1 to 65535.")
    return value


OFFICE_NORMALIZERS = {
    "tower": normalize_tower,
    "owner": normalize_owner,
    "phone": normalize_phone,
    "website": normalize_website,
}
OPTIONAL_OFFICE_FIELDS = {"phone", "website"}


def normalize_office_value(field, value):
    if value is None:
        return "" if field in OPTIONAL_OFFICE_FIELDS else None
    if not isinstance(value, str):
        raise ValidationError("Enter a text value.")
    normalize = OFFICE_NORMALIZERS.get(field)
    return normalize(value) if normalize else value
