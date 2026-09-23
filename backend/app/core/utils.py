from datetime import datetime


def format_size(size_bytes: int) -> str:
    ko = size_bytes / 1024
    if ko > 1024:
        return f"{ko / 1024:.1f} Mo"
    return f"{round(ko)} Ko"


def format_datetime_fr(dt: datetime | None = None) -> str:
    dt = dt or datetime.utcnow()
    return dt.strftime("%d/%m/%Y %H:%M")


def format_time_fr(dt: datetime | None = None) -> str:
    dt = dt or datetime.utcnow()
    return dt.strftime("%H:%M")
