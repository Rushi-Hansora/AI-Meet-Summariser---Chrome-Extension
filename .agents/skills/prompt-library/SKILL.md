---
name: prompt-library
description: >-
  Use this skill when the user asks about prompt management, wants to modify
  AI prompts used for report generation, or needs to add new prompt types.
  Contains the current prompt templates and guidelines for prompt engineering
  within this extension.
---

# Prompt Library — AI Meet Summarizer

## Current Bundled Prompt (used in `popup.js` → `handleGenerateReports()`)

This single prompt generates all 3 report sections in one API call:

```
Analyze the following meeting transcript and provide three distinct sections:
SUMMARY, Q&A, and TASKS. Use the exact tags [SUMMARY_START], [SUMMARY_END],
[QA_START], [QA_END], [TASKS_START], and [TASKS_END] to separate these sections.
Do not use codeblocks or surrounding markdown backticks.

Guidelines:
1. SUMMARY: Provide a structured summary. Begin with a 2-3 sentence Executive
   Summary, followed by bullet points of main discussion topics and decisions.

2. Q&A: Identify all questions and answers. Format as Q&A pairs:
   **Q: [Question]** asked by [Name]
   **A: [Answer]** answered by [Name]
   If unanswered, note "Answer not found in meeting."
   If no questions, write "No questions detected in this meeting."

3. TASKS: Extract all tasks, action items, next steps, and todos.
   Format as Markdown checklist:
   - [ ] Task - Assigned to: [Name]
   If none, write "No action items or tasks detected."

Transcript:
{transcriptText}
```

## Transcript Format Fed to Prompts

Each turn is formatted as:
```
[elapsed_time] Speaker Name: Caption text
```

Example:
```
[0:00] John: Good morning everyone, let's start with the updates.
[0:15] Sarah: The frontend redesign is 80% complete.
[2:30] John: What about the API integration timeline?
[2:45] Mike: We should have it ready by next Friday.
```

## Prompt Engineering Guidelines for This Project

1. **Temperature**: Always use `0.3` for factual, structured outputs.
2. **Delimiter tags**: Use `[TAG_START]...[TAG_END]` pattern for parseable sections.
3. **Fallback instruction**: Include "Do not use codeblocks" to prevent markdown fence wrapping.
4. **Token budget**: Prompt is truncated at 32,000 chars. For HuggingFace, `max_new_tokens` is 1,200.
5. **Speaker attribution**: Prompts should ask for speaker names in Q&A and Tasks sections.

## Adding a New Report Type

1. Add the new delimiter tags to the bundled prompt (e.g., `[DECISIONS_START]...[DECISIONS_END]`).
2. Add regex parsing in `handleGenerateReports()`:
   ```js
   const decisionsMatch = combinedText.match(/\[DECISIONS_START\]([\s\S]*?)\[DECISIONS_END\]/);
   ```
3. Add a new storage key (e.g., `meetDecisions`).
4. Add a new tab in `popup.html` and panel container.
5. Update `pollTranscript()` to render the new panel.
6. Update `handleClearTranscript()` to clear the new key.
7. Update `handleDownloadReport()` to include the new section in the Markdown export.
8. Update `handleCopyActiveTab()` to handle the new tab.

## Prompt Improvement Ideas (Future)

- Add meeting context (title, participant count) to the prompt header.
- Use system message for OpenAI instead of putting everything in user content.
- Add language detection to generate reports in the meeting's language.
- Support custom user-defined prompt templates via options page.
- Streaming responses for real-time report generation feedback.
