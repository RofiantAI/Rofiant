import type { FederalSolutionId } from "@/lib/federal-solutions";

export function workflowOutputToMarkdown(
  solutionId: FederalSolutionId,
  title: string,
  output: Record<string, unknown>,
  meta?: { runAt?: string; inputText?: string; taskLabel?: string },
): string {
  const lines: string[] = [
    `# ${title}`,
    "",
    `**Solution:** ${solutionId}`,
  ];
  if (meta?.taskLabel) lines.push(`**Task:** ${meta.taskLabel}`);
  if (meta?.runAt) lines.push(`**Generated:** ${meta.runAt}`);
  if (meta?.inputText?.trim()) {
    lines.push("", "## Input context", "", meta.inputText.trim());
  }

  const deliverables = output.deliverables as Array<{ type: string; title: string; content: string }> | undefined;
  const actionItems = output.actionItems as Array<{ action: string; ownerRole: string; priority: string; dueInDays?: number }> | undefined;

  if (deliverables?.length) {
    lines.push("", "## Deliverables");
    for (const d of deliverables) {
      lines.push("", `### ${d.title} (${d.type})`, "", d.content);
    }
  }

  if (actionItems?.length) {
    lines.push("", "## Action items");
    for (const item of actionItems) {
      const due = item.dueInDays != null ? ` — due in ${item.dueInDays}d` : "";
      lines.push(`- **[${item.priority}]** ${item.action} _(${item.ownerRole}${due})_`);
    }
  }

  if (typeof output.summary === "string" && output.summary.trim()) {
    lines.push("", "## Summary", "", output.summary.trim());
  }

  lines.push("", "## Full structured output", "", "```json", JSON.stringify(output, null, 2), "```");
  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printWorkflowReport(title: string, htmlBody: string) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 2rem; color: #111; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
  h2 { font-size: 1rem; margin-top: 1.5rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
  p, li { font-size: 0.875rem; line-height: 1.5; }
  pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; font-size: 0.75rem; }
  .meta { color: #666; font-size: 0.8rem; }
</style></head><body>${htmlBody}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export function workflowOutputToPrintHtml(
  title: string,
  output: Record<string, unknown>,
  meta?: { runAt?: string; inputText?: string; taskLabel?: string },
): string {
  const parts = [`<h1>${escapeHtml(title)}</h1>`];
  if (meta?.taskLabel) parts.push(`<p class="meta">Task: ${escapeHtml(meta.taskLabel)}</p>`);
  if (meta?.runAt) parts.push(`<p class="meta">Generated ${escapeHtml(meta.runAt)}</p>`);
  if (meta?.inputText?.trim()) {
    parts.push(`<h2>Input context</h2><p>${escapeHtml(meta.inputText.trim())}</p>`);
  }

  const deliverables = output.deliverables as Array<{ type: string; title: string; content: string }> | undefined;
  if (deliverables?.length) {
    parts.push("<h2>Deliverables</h2>");
    for (const d of deliverables) {
      parts.push(
        `<h3>${escapeHtml(d.title)} <span class="meta">(${escapeHtml(d.type)})</span></h3>`,
        `<pre>${escapeHtml(d.content)}</pre>`,
      );
    }
  }

  const actionItems = output.actionItems as Array<{ action: string; ownerRole: string; priority: string }> | undefined;
  if (actionItems?.length) {
    parts.push("<h2>Action items</h2><ul>");
    for (const item of actionItems) {
      parts.push(`<li><strong>[${escapeHtml(item.priority)}]</strong> ${escapeHtml(item.action)} <em>(${escapeHtml(item.ownerRole)})</em></li>`);
    }
    parts.push("</ul>");
  }

  if (typeof output.summary === "string" && output.summary.trim()) {
    parts.push(`<h2>Summary</h2><p>${escapeHtml(output.summary.trim())}</p>`);
  }

  parts.push(
    `<h2>Structured output</h2><pre>${escapeHtml(JSON.stringify(output, null, 2))}</pre>`,
  );
  return parts.join("");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
