#!/usr/bin/env python3
"""Validate the repository's Claude agents and locally vendored skills."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AGENTS_DIR = ROOT / ".claude" / "agents"
SKILLS_DIR = ROOT / ".claude" / "skills"

REQUIRED_AGENT_FIELDS = {"name", "description"}
ALLOWED_AGENT_FIELDS = {
    "name",
    "description",
    "tools",
    "disallowedTools",
    "model",
    "permissionMode",
    "maxTurns",
    "skills",
    "memory",
    "background",
    "isolation",
}
ALLOWED_TOOLS = {"Read", "Grep", "Glob", "Edit", "Write", "Bash", "Skill"}
NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
BACKTICKED_NAME = re.compile(r"`([a-z0-9]+(?:-[a-z0-9]+)*)`")
READ_ONLY_AGENTS = {"code-reviewer", "security-reviewer"}
WRITE_TOOLS = {"Edit", "Write"}
# Documents that must reference every agent (and, for the team README, every skill),
# so the delegation table and the role inventory cannot silently drift.
AGENT_INDEX_DOCUMENTS = ("CLAUDE.md", ".claude/README.md")
SKILL_INDEX_DOCUMENTS = (".claude/README.md",)


class ValidationError(ValueError):
    """Raised when a Claude configuration file violates the local contract."""


def frontmatter(document: str, path: Path) -> list[str]:
    """Return frontmatter lines from a Markdown document."""
    lines = document.splitlines()
    if not lines or lines[0] != "---":
        raise ValidationError(f"{path}: missing opening frontmatter delimiter")
    try:
        end = lines.index("---", 1)
    except ValueError as error:
        raise ValidationError(
            f"{path}: missing closing frontmatter delimiter"
        ) from error
    return lines[1:end]


def parse_agent(path: Path) -> dict[str, str | list[str]]:
    """Parse the deliberately small YAML subset used by project agents."""
    result: dict[str, str | list[str]] = {}
    current_list: str | None = None
    for number, line in enumerate(frontmatter(path.read_text(), path), start=2):
        if line.startswith("  - "):
            if current_list is None:
                raise ValidationError(f"{path}:{number}: list item without key")
            value = result[current_list]
            if not isinstance(value, list):
                raise ValidationError(f"{path}:{number}: invalid list")
            value.append(line[4:].strip())
            continue
        match = re.fullmatch(r"([A-Za-z][A-Za-z0-9]*):(?: (.*))?", line)
        if not match:
            raise ValidationError(f"{path}:{number}: unsupported YAML syntax")
        key, value = match.groups()
        if key in result:
            raise ValidationError(f"{path}:{number}: duplicate key {key}")
        if value is None:
            result[key] = []
            current_list = key
        else:
            result[key] = value.strip('"')
            current_list = None
    return result


def parse_tools(agent: dict[str, str | list[str]]) -> set[str] | None:
    """Return the declared tool set, or None when the agent inherits every tool."""
    raw = agent.get("tools")
    if raw is None or not str(raw).strip():
        return None
    return {item.strip() for item in str(raw).split(",") if item.strip()}


def referenced_names(document: str) -> set[str]:
    """Return every backticked kebab-case identifier mentioned in a document."""
    return set(BACKTICKED_NAME.findall(document))


def validate(root: Path = ROOT) -> list[str]:
    """Return every configuration error found below *root*."""
    errors: list[str] = []
    agents_dir = root / ".claude" / "agents"
    skills_dir = root / ".claude" / "skills"
    skill_names: set[str] = set()

    for skill_file in sorted(skills_dir.glob("*/SKILL.md")):
        directory_name = skill_file.parent.name
        try:
            lines = frontmatter(skill_file.read_text(), skill_file)
            name_line = next(line for line in lines if line.startswith("name: "))
            declared_name = name_line.removeprefix("name: ").strip('"')
            if declared_name != directory_name:
                errors.append(
                    f"{skill_file}: skill name {declared_name!r} does not match "
                    f"directory {directory_name!r}"
                )
            skill_names.add(declared_name)
        except (ValidationError, StopIteration) as error:
            errors.append(f"{skill_file}: invalid skill frontmatter: {error}")

    seen_agents: set[str] = set()
    for agent_file in sorted(agents_dir.glob("*.md")):
        try:
            agent = parse_agent(agent_file)
            missing = REQUIRED_AGENT_FIELDS - agent.keys()
            unknown = agent.keys() - ALLOWED_AGENT_FIELDS
            if missing:
                errors.append(f"{agent_file}: missing fields {sorted(missing)}")
            if unknown:
                errors.append(f"{agent_file}: unknown fields {sorted(unknown)}")
            name = str(agent.get("name", ""))
            if not NAME_PATTERN.fullmatch(name):
                errors.append(f"{agent_file}: invalid agent name {name!r}")
            if name in seen_agents:
                errors.append(f"{agent_file}: duplicate agent name {name!r}")
            seen_agents.add(name)
            tools = parse_tools(agent)
            if tools is None:
                if name in READ_ONLY_AGENTS:
                    errors.append(
                        f"{agent_file}: independent reviewer must declare an "
                        "explicit read-only tool list"
                    )
            else:
                unknown_tools = tools - ALLOWED_TOOLS
                if unknown_tools:
                    errors.append(
                        f"{agent_file}: unknown tools {sorted(unknown_tools)}"
                    )
                if name in READ_ONLY_AGENTS and tools & WRITE_TOOLS:
                    errors.append(
                        f"{agent_file}: independent reviewer has write tools "
                        f"{sorted(tools & WRITE_TOOLS)}"
                    )
            if agent.get("model") != "inherit":
                errors.append(f"{agent_file}: model must be 'inherit'")
            declared_skills = agent.get("skills", [])
            if not isinstance(declared_skills, list):
                errors.append(f"{agent_file}: skills must be a list")
            else:
                for skill in declared_skills:
                    if skill not in skill_names:
                        errors.append(f"{agent_file}: missing skill {skill!r}")
        except ValidationError as error:
            errors.append(str(error))

    if not seen_agents:
        errors.append(f"{agents_dir}: no agent definitions found")
    if not skill_names:
        errors.append(f"{skills_dir}: no skill definitions found")

    for relative in AGENT_INDEX_DOCUMENTS:
        document = root / relative
        if not document.is_file():
            errors.append(f"{document}: missing index document")
            continue
        names = referenced_names(document.read_text())
        for agent_name in sorted(seen_agents - names):
            errors.append(f"{document}: agent {agent_name!r} is not referenced")
        if relative in SKILL_INDEX_DOCUMENTS:
            for skill_name in sorted(skill_names - names):
                errors.append(f"{document}: skill {skill_name!r} is not referenced")
    return errors


def main() -> int:
    """Print validation errors and return a shell-friendly status."""
    errors = validate()
    if errors:
        print("Claude configuration validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    agent_count = len(list(AGENTS_DIR.glob("*.md")))
    skill_count = len(list(SKILLS_DIR.glob("*/SKILL.md")))
    print(f"Validated {agent_count} agents and {skill_count} skills.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
