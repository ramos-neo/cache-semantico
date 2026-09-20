import logging

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("tickets")

SEPARATOR = "─" * 64


def log_block(title: str, fields: dict) -> None:
    lines = [SEPARATOR, title, SEPARATOR]
    width = max(len(k) for k in fields)
    for label, value in fields.items():
        lines.append(f"  {label:<{width}} : {value}")
    lines.append(SEPARATOR)
    logger.info("\n" + "\n".join(lines) + "\n")
