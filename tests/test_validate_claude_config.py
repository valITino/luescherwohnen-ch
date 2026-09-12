from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.validate_claude_config import ValidationError, parse_agent, validate


class ClaudeConfigValidationTests(unittest.TestCase):
    def test_repository_configuration_is_valid(self) -> None:
        self.assertEqual(validate(), [])

    def test_parse_agent_rejects_missing_frontmatter(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "agent.md"
            path.write_text("# Agent\n")
            with self.assertRaisesRegex(ValidationError, "missing opening"):
                parse_agent(path)

    def test_validate_reports_unresolved_skill(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            agents = root / ".claude" / "agents"
            skills = root / ".claude" / "skills" / "known"
            agents.mkdir(parents=True)
            skills.mkdir(parents=True)
            (skills / "SKILL.md").write_text("---\nname: known\n---\n")
            (agents / "worker.md").write_text(
                "---\nname: worker\ndescription: test\ntools: Read\n"
                "skills:\n  - absent\n---\n"
            )
            self.assertTrue(
                any("missing skill 'absent'" in error for error in validate(root))
            )

    def test_validate_rejects_write_access_for_independent_reviewer(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            agents = root / ".claude" / "agents"
            skills = root / ".claude" / "skills" / "known"
            agents.mkdir(parents=True)
            skills.mkdir(parents=True)
            (skills / "SKILL.md").write_text("---\nname: known\n---\n")
            (agents / "code-reviewer.md").write_text(
                "---\nname: code-reviewer\ndescription: test\n"
                "tools: Read, Write\nmodel: inherit\n---\n"
            )
            self.assertTrue(
                any("reviewer has write tools" in error for error in validate(root))
            )


if __name__ == "__main__":
    unittest.main()
