from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.validate_claude_config import ValidationError, parse_agent, validate

SKILL = "---\nname: known\n---\n"


def make_root(directory: str, agent_name: str, agent_body: str) -> Path:
    """Create a minimal repository layout with one skill and one agent."""
    root = Path(directory)
    agents = root / ".claude" / "agents"
    skills = root / ".claude" / "skills" / "known"
    agents.mkdir(parents=True)
    skills.mkdir(parents=True)
    (skills / "SKILL.md").write_text(SKILL)
    (agents / f"{agent_name}.md").write_text(agent_body)
    index = f"Agents: `{agent_name}`; skills: `known`.\n"
    (root / "CLAUDE.md").write_text(index)
    (root / ".claude" / "README.md").write_text(index)
    return root


class ClaudeConfigValidationTests(unittest.TestCase):
    def test_repository_configuration_is_valid(self) -> None:
        self.assertEqual(validate(), [])

    def test_parse_agent_rejects_missing_frontmatter(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "agent.md"
            path.write_text("# Agent\n")
            with self.assertRaisesRegex(ValidationError, "missing opening"):
                parse_agent(path)

    def test_minimal_valid_layout_has_no_errors(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(
                directory,
                "worker",
                "---\nname: worker\ndescription: test\ntools: Read\n"
                "model: inherit\nskills:\n  - known\n---\n",
            )
            self.assertEqual(validate(root), [])

    def test_validate_reports_unresolved_skill(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(
                directory,
                "worker",
                "---\nname: worker\ndescription: test\ntools: Read\n"
                "model: inherit\nskills:\n  - absent\n---\n",
            )
            self.assertTrue(
                any("missing skill 'absent'" in error for error in validate(root))
            )

    def test_validate_rejects_write_access_for_independent_reviewer(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(
                directory,
                "code-reviewer",
                "---\nname: code-reviewer\ndescription: test\n"
                "tools: Read, Write\nmodel: inherit\n---\n",
            )
            self.assertTrue(
                any("reviewer has write tools" in error for error in validate(root))
            )

    def test_agent_without_tools_inherits_and_is_accepted(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(
                directory,
                "worker",
                "---\nname: worker\ndescription: test\nmodel: inherit\n---\n",
            )
            self.assertEqual(validate(root), [])

    def test_reviewer_without_tools_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(
                directory,
                "security-reviewer",
                "---\nname: security-reviewer\ndescription: test\n"
                "model: inherit\n---\n",
            )
            self.assertTrue(
                any("explicit read-only tool list" in error for error in validate(root))
            )

    def test_unreferenced_agent_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(
                directory,
                "worker",
                "---\nname: worker\ndescription: test\ntools: Read\n"
                "model: inherit\n---\n",
            )
            (root / "CLAUDE.md").write_text("No delegation table yet.\n")
            errors = validate(root)
            self.assertTrue(
                any("agent 'worker' is not referenced" in error for error in errors)
            )


if __name__ == "__main__":
    unittest.main()
